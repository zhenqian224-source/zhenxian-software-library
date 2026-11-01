'use strict';

const baseUrl = (process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(
  /\/$/,
  ''
);

async function main() {
  const started = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(`健康检查失败，HTTP ${response.status}`);
    }
    const elapsed = Date.now() - started;
    console.log('');
    console.log('  震纤软件库 · 健康检查');
    console.log(`  状态     正常 (${elapsed}ms)`);
    console.log(`  地址     ${baseUrl}`);
    console.log(`  数据库   ${payload.database}`);
    console.log(`  服务时间 ${payload.time}`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error('  震纤软件库 · 健康检查失败');
    console.error(`  地址   ${baseUrl}`);
    console.error(`  原因   ${error.message}`);
    console.error('  提示   请先在另一个终端运行 npm start');
    console.error('');
    process.exitCode = 1;
  }
}

main();
