const { info, getInput } = require('@actions/core');
const fs = require('fs');
const { execFileSync, execSync } = require('child_process');

const privateKey = getInput('ssh-key');
const repository = getInput('repository');
const ref = getInput('ref');

// 获取SSH路径
const sshHomePath = `${process.env.HOME}/.ssh`;

console.log('sshHomePath', sshHomePath);

info('SSH > Creating SSH home folder');
// 创建.ssh文件夹
fs.mkdirSync(sshHomePath, { recursive: true });
// 扫描阿里云效host
execSync(`ssh-keyscan -H codeup.aliyun.com >> ${sshHomePath}/known_hosts`);

info('SSH > Starting the SSH agent');
// 配置ssh代理
const sshAgentOutput = execFileSync('ssh-agent');
const lines = sshAgentOutput.toString().split('\n');
for (const lineNumber in lines) {
  const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(
    lines[lineNumber]
  );
  if (matches && matches.length > 0) {
    process.env[matches[1]] = matches[2];
  }
}

info('SSH > Adding the private key');
// 添加私有key
privateKey.split(/(?=-----BEGIN)/).forEach(function (key) {
  execSync('ssh-add -', { input: key.trim() + '\n' });
});
execSync('ssh-add -l', { stdio: 'inherit' });

const cloneWithSSH = (repository) => {
  let currentPath = execSync('pwd');
  const command = `git clone --depth=1 -b ${ref} git@codeup.aliyun.com:${repository}.git ${currentPath}`;
  info(`SSH > ${command}`);
  execSync(command);
};

cloneWithSSH(repository);
