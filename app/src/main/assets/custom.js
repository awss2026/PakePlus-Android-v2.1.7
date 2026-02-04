window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}
// ====== 动态消息通知脚本 for EPhone (PakePlus) ======
// 首次运行时会请求通知权限，请点击“允许”
// 请仔细阅读下方的“配置与使用说明”

document.addEventListener('DOMContentLoaded', function() {
  console.log("[EPhone通知脚本] 脚本加载，开始初始化...");

  // ====== 核心配置（请根据你的网站实际情况修改）=======
  const CONFIG = {
    // 策略1：首选 - 精确元素选择器 (需要你自行查找)
    // 请使用F12开发者工具，点击一条AI回复消息，查看其HTML结构，将找到的稳定class或属性填在这里
    messageSelector: '.message-text, [class*="message"], [class*="content"]', // 多个选择器用逗号分隔，按优先级尝试
    // 策略2：备用 - 关键词监听 (如果找不到稳定选择器，主要靠这个)
    triggerKeywords: ['回复', ':', 'AI说', '——'], // 当页面新出现的文本包含这些词时触发通知
    // 通知内容
    notificationTitle: '💬 EPhone 新消息',
    notificationBody: '您收到一条新的回复，请查收。', // 如果无法提取消息正文，则使用此默认文案
    notificationIcon: 'https://cx3300-1.github.io/sfsfdf/favicon.ico', // 通知图标，可保留默认
    // 高级设置（一般无需修改）
    observerTarget: 'body', // 监听整个页面body的变化
    debounceTime: 1500, // 防抖延迟(毫秒)，避免短时间重复通知
    enableDebugLog: true // 开启后在浏览器控制台打印调试信息
  };
  // ====== 配置结束 ======

  // 1. 检查并请求通知权限
  if (!("Notification" in window)) {
    console.error("[EPhone通知脚本] 错误：当前浏览器环境不支持Web通知API。");
    alert('当前环境不支持通知功能，请尝试使用Chrome内核的浏览器打包。');
    return;
  }

  function initNotification() {
    if (Notification.permission === "granted") {
      if(CONFIG.enableDebugLog) console.log("[EPhone通知脚本] 权限已授予，启动监听...");
      startObserving();
    } else if (Notification.permission === "default") {
      if(CONFIG.enableDebugLog) console.log("[EPhone通知脚本] 正在请求通知权限...");
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          if(CONFIG.enableDebugLog) console.log("[EPhone通知脚本] 权限已授予，启动监听...");
          startObserving();
        } else {
          console.warn("[EPhone通知脚本] 用户拒绝了通知权限，功能将无法使用。");
        }
      });
    } else {
      console.warn("[EPhone通知脚本] 通知权限已被禁止，请在浏览器设置中手动启用。");
    }
  }

  // 2. 启动变化监听
  function startObserving() {
    let lastTextSnapshot = document.body.innerText;
    let lastMessageCount = 0;
    let isCooldown = false;

    const observer = new MutationObserver(function(mutationsList) {
      // 防抖处理
      if (isCooldown) return;
      isCooldown = true;
      setTimeout(() => { isCooldown = false; }, CONFIG.debounceTime);

      // 策略A：尝试通过精确选择器查找新消息
      if (CONFIG.messageSelector) {
        const currentMessages = document.querySelectorAll(CONFIG.messageSelector);
        if (currentMessages.length > lastMessageCount) {
          const newMessage = currentMessages[currentMessages.length - 1];
          const messageText = newMessage.textContent?.trim().slice(0, 50) || CONFIG.notificationBody;
          triggerNotification(messageText);
          lastMessageCount = currentMessages.length;
          if(CONFIG.enableDebugLog) console.log("[EPhone通知脚本] 通过选择器捕获到新消息。");
          return; // 如果选择器策略成功，则不再执行关键词策略
        }
        lastMessageCount = currentMessages.length;
      }

      // 策略B：通过页面全文和关键词监听
      const currentText = document.body.innerText;
      if (currentText !== lastTextSnapshot) {
        const newText = currentText.replace(lastTextSnapshot, '');
        // 检查新出现的文本是否包含触发关键词
        const hasKeyword = CONFIG.triggerKeywords.some(keyword => newText.includes(keyword));
        if (hasKeyword) {
          if(CONFIG.enableDebugLog) console.log("[EPhone通知脚本] 检测到包含关键词的文本变化，触发通知。", newText.slice(0,30));
          triggerNotification(CONFIG.notificationBody);
        }
        lastTextSnapshot = currentText;
      }
    });

    // 开始监听整个文档的变化（深度监听）
    const targetNode = document.querySelector(CONFIG.observerTarget);
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,  // 监听子元素的添加/移除
        subtree: true,    // 监听所有后代元素
        characterData: true, // 监听文本内容变化
        attributes: false
      });
      if(CONFIG.enableDebugLog) console.log(`[EPhone通知脚本] 已启动变化监听器，目标：${CONFIG.observerTarget}`);
    } else {
      console.error("[EPhone通知脚本] 错误：找不到监听目标节点。");
    }
  }

  // 3. 触发通知的函数
  function triggerNotification(bodyText) {
    try {
      const notification = new Notification(CONFIG.notificationTitle, {
        body: bodyText,
        icon: CONFIG.notificationIcon,
        requireInteraction: false // 设为true则通知会持续直到用户点击
      });
      notification.onclick = function() {
        window.focus(); // 点击通知时尝试激活应用窗口
        this.close();
      };
      if(CONFIG.enableDebugLog) console.log("[EPhone通知脚本] 系统通知已发送。");
    } catch (err) {
      console.error("[EPhone通知脚本] 发送通知时出错:", err);
    }
  }

  // 延迟初始化，等待页面完全加载
  setTimeout(initNotification, 1000);
});
window.open = function (url, target, features) {
    console.log('open', url, target, features)
    location.href = url
}

document.addEventListener('click', hookClick, { capture: true })
