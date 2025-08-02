// 正确的 Service Worker 格式
addEventListener('fetch', event => {
  event.respondWith(routeRequest(event.request));
});

// 辅助函数，用于包装和计时异步操作
async function timeFunction(promiseFn) {
  const startTime = performance.now();
  const result = await promiseFn();
  const endTime = performance.now();
  return { result, duration: Math.round(endTime - startTime) };
}

// routeRequest 和 handleRequest 不再需要 env 参数
async function routeRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-control-allow-methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const response = await handleRequest(request);

  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持POST请求' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405
    });
  }

  try {
    const { image } = await request.json();
    if (!image) {
      return new Response(JSON.stringify({ error: '缺少图像数据' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 并行执行带计时的API调用
    const userGesturePromise = timeFunction(() => recognizeGesture(image));
    const aiGesturePromise = timeFunction(generateAIGesture);

    // 等待两个请求都完成
    const [userResult, aiResult] = await Promise.all([userGesturePromise, aiGesturePromise]);

    const userGesture = userResult.result;
    const userGestureTime = userResult.duration;
    const aiGesture = aiResult.result;
    const aiGestureTime = aiResult.duration;

    // 检查模型是否成功返回了有效手势
    if (!['石头', '剪刀', '布'].includes(userGesture)) {
      return new Response(JSON.stringify({ error: `无法识别手势，模型可能返回了非预期结果: ${userGesture}` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    if (!['石头', '剪刀', '布'].includes(aiGesture)) {
        return new Response(JSON.stringify({ error: `AI出拳失败，模型可能返回了非预期结果: ${aiGesture}` }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }

    const result = determineWinner(userGesture, aiGesture);

    return new Response(JSON.stringify({
      userGesture,
      aiGesture,
      result,
      userGestureTime, // 新增：用户手势识别耗时
      aiGestureTime   // 新增：AI出拳耗时
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err) {
    // 这个 catch 会捕获由 throw new Error 抛出的错误
    console.error('Worker Error:', err.stack);
    return new Response(JSON.stringify({ error: '服务器内部错误: ' + err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

// 使用全局变量 API_KEY，不传递 env
async function recognizeGesture(imageBase64) {
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`, // 正确的全局变量用法
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'THUDM/GLM-4.1V-9B-Thinking',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: 'text', text: '请识别图片中的手势是石头、剪刀还是布？' }
        ]
      }],
      max_tokens: 50
    })
  });

  // 健壮的错误处理
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`手势识别API失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // 安全地访问返回的数据
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    console.error('手势识别API返回无效数据:', JSON.stringify(data));
    return '识别失败';
  }
  const content = data.choices[0].message.content || '';
  return parseGesture(content);
}

// 使用全局变量 API_KEY，不传递 env
async function generateAIGesture() {
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`, // 正确的全局变量用法
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen3-8B', // 更新模型名称
      messages: [
        { "role": "system", "content": "你是一个正在玩石头剪刀布游戏的助手。" },
        { "role": "user", "content": "你正在玩一个石头剪刀布的游戏。你的任务是从'rock'、'paper'或'scissors'中选择一个。你必须只用一个词来回答，不能有任何其他的文字、解释或标点符号。不要思考，快速给出你的答案" }
      ],
      max_tokens: 10, // 限制输出长度
      temperature: 1.0 // 增加随机性
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI出拳API失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    console.error('AI出拳API返回无效数据:', JSON.stringify(data));
    return '生成失败';
  }
  
  const aiMessage = (data.choices[0].message.content || '').trim().toLowerCase();

  // 因为模型现在返回英文，我们需要在这里处理并翻译
  const translationMap = {
    "rock": "石头",
    "paper": "布",
    "scissors": "剪刀"
  };

  for (const en in translationMap) {
    if (aiMessage.includes(en)) {
      return translationMap[en]; // 返回中文，以兼容 determineWinner 函数
    }
  }

  // 如果模型返回了意外的内容，则返回原始消息用于调试
  console.error(`AI 返回了意外的响应: '${aiMessage}'`);
  return aiMessage; 
}

function parseGesture(text) {
  const gestures = ['石头', '剪刀', '布'];
  for (const gesture of gestures) {
    if (text.includes(gesture)) {
      return gesture;
    }
  }
  return text; // 如果没找到，返回原始文本用于调试
}

function determineWinner(user, ai) {
  if (user === ai) return '平局';
  if (
    (user === '石头' && ai === '剪刀') ||
    (user === '剪刀' && ai === '布') ||
    (user === '布' && ai === '石头')
  ) return '你赢了';
  return 'AI赢了';
}

