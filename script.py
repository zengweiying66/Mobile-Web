import urllib.request
import urllib.error
import time
import hashlib
import shutil
from pathlib import Path
import json
import re


class ProjectMirrorSync:
    """项目镜像同步器 - 清理HTML注入脚本"""

    def __init__(self, base_url, local_path, check_interval=60):
        self.base_url = base_url.rstrip('/')
        self.local_path = Path(local_path)
        self.check_interval = check_interval
        self.hash_file = self.local_path / '.file_hashes.json'
        self.file_hashes = self.load_hashes()
        self.stats = {'downloaded': 0, 'skipped': 0, 'failed': 0}

    def load_hashes(self):
        if self.hash_file.exists():
            try:
                with open(self.hash_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def save_hashes(self):
        try:
            self.local_path.mkdir(parents=True, exist_ok=True)
            with open(self.hash_file, 'w', encoding='utf-8') as f:
                json.dump(self.file_hashes, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"  保存哈希失败: {e}")

    def get_file_hash(self, content):
        if isinstance(content, str):
            content = content.encode('utf-8')
        return hashlib.md5(content).hexdigest()

    def get_local_file_hash(self, file_path):
        try:
            if not file_path.exists():
                return None
            with open(file_path, 'rb') as f:
                return self.get_file_hash(f.read())
        except:
            return None

    def download_file(self, url):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read()
        except urllib.error.HTTPError as e:
            print(f"    HTTP错误 {e.code}")
            return None
        except Exception as e:
            print(f"    下载失败: {str(e)[:50]}")
            return None

    def clean_html(self, content):
        """
        清理HTML中注入的脚本
        只保留 <!DOCTYPE> 到 </html> 之间的原始内容
        """
        try:
            text = content.decode('utf-8', errors='ignore')

            # 方法1: 找到</html>标签，截断后面的内容
            html_end = text.find('</html>')
            if html_end != -1:
                # 找到</html>标签的结束位置
                html_end_tag = html_end + len('</html>')
                text = text[:html_end_tag]

            # 方法2: 移除</body>和</html>之间的注入脚本
            # 这些脚本通常在</body>后面，</html>前面
            text = re.sub(
                r'(</body>\s*)<script>.*?livereload.*?</script>\s*(<script>.*?</script>\s*)*\s*(</html>)',
                r'\1\3',
                text,
                flags=re.DOTALL | re.IGNORECASE
            )

            # 方法3: 直接移除LiveReload相关的script标签
            patterns = [
                r'<script>document\.write\(.*?livereload\.js.*?\)</script>',
                r'<script>\s*document\.addEventListener\(.*?LiveReloadDisconnect.*?\)</script>',
                r'<script>\s*class\s+reloadPlugin.*?</script>',
                r'<script[^>]*src=["\'][^"\']*livereload\.js[^"\']*["\'][^>]*></script>',
                r'<script[^>]*src=["\'][^"\']*:35929[^"\']*["\'][^>]*></script>',
            ]

            for pattern in patterns:
                text = re.sub(pattern, '', text, flags=re.DOTALL | re.IGNORECASE)

            # 清理</html>后面的所有内容
            text = re.sub(r'(</html>).*$', r'\1', text, flags=re.DOTALL)

            # 清理多余的空行
            text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)

            # 确保以</html>结尾
            text = text.strip()
            if not text.endswith('</html>'):
                text += '\n</html>'

            return text.encode('utf-8')

        except Exception as e:
            print(f"    清理HTML失败: {e}")
            return content

    def compare_and_download(self, remote_path):
        """对比并下载文件"""
        url = f"{self.base_url}/{remote_path}"
        file_icon = self.get_file_icon(remote_path)
        local_file = self.local_path / remote_path

        # 下载远程文件
        remote_content = self.download_file(url)
        if not remote_content:
            print(f"  ❌ {file_icon} {remote_path}")
            self.stats['failed'] += 1
            return False

        # 检查是否是404页面
        text = remote_content.decode('utf-8', errors='ignore')
        if '404' in text and 'Page Not Found' in text:
            print(f"  ❌ {file_icon} {remote_path} (404)")
            self.stats['failed'] += 1
            return False

        # 如果是HTML文件，清理注入的脚本
        if remote_path.endswith(('.html', '.htm')):
            remote_content = self.clean_html(remote_content)

        # 计算哈希
        remote_hash = self.get_file_hash(remote_content)
        local_hash = self.get_local_file_hash(local_file)
        stored_hash = self.file_hashes.get(remote_path)

        # 对比
        if local_hash == remote_hash and stored_hash == remote_hash:
            print(f"  ⏭️  {file_icon} {remote_path} (未变化)")
            self.stats['skipped'] += 1
            return True

        # 保存
        try:
            local_file.parent.mkdir(parents=True, exist_ok=True)
            with open(local_file, 'wb') as f:
                f.write(remote_content)

            self.file_hashes[remote_path] = remote_hash

            if local_hash is None:
                print(f"  ✨ {file_icon} {remote_path} (新文件)")
            else:
                print(f"  🔄 {file_icon} {remote_path} (已更新)")

            self.stats['downloaded'] += 1
            return True

        except Exception as e:
            print(f"  ❌ {file_icon} {remote_path} - {e}")
            self.stats['failed'] += 1
            return False

    def get_file_icon(self, filename):
        if filename.endswith(('.html', '.htm')):
            return "📄"
        elif filename.endswith('.css'):
            return "🎨"
        elif filename.endswith('.js'):
            return "⚙️"
        elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp')):
            return "🖼️"
        elif filename.endswith(('.woff', '.woff2', '.ttf', '.eot', '.otf')):
            return "🔤"
        else:
            return "📦"

    def get_file_structure(self):
        """
        ⚠️ 请在这里添加您的项目文件列表
        """
        return [
            'index.html',
            # 添加更多文件...
            # 'css/style.css',
            # 'js/main.js',
            # 'images/logo.png',
        ]

    def scan_local_files(self):
        files = []
        if not self.local_path.exists():
            return files

        for item in self.local_path.rglob('*'):
            if item.is_file() and item.name != '.file_hashes.json':
                rel_path = item.relative_to(self.local_path)
                files.append(str(rel_path).replace('\\', '/'))

        return files

    def sync_project(self, auto_detect=False):
        print(f"\n{'=' * 70}")
        print(f"🔄 开始同步项目")
        print(f"{'=' * 70}\n")

        self.stats = {'downloaded': 0, 'skipped': 0, 'failed': 0}

        if auto_detect and self.local_path.exists():
            print("🔍 自动检测本地文件...")
            file_list = self.scan_local_files()
            if file_list:
                print(f"   发现 {len(file_list)} 个文件")
            else:
                file_list = self.get_file_structure()
        else:
            file_list = self.get_file_structure()

        if not file_list:
            print("❌ 文件列表为空！")
            print("💡 请在 get_file_structure() 中添加文件")
            return

        print(f"📋 文件总数: {len(file_list)}\n")

        for i, file_path in enumerate(file_list, 1):
            print(f"[{i:3d}/{len(file_list)}] ", end='')
            self.compare_and_download(file_path)

        self.save_hashes()

        print(f"\n{'=' * 70}")
        print(f"✅ 同步完成")
        print(f"{'=' * 70}")
        print(f"  ✨ 新增/更新: {self.stats['downloaded']} 个")
        print(f"  ⏭️  未变化: {self.stats['skipped']} 个")
        if self.stats['failed'] > 0:
            print(f"  ❌ 失败: {self.stats['failed']} 个")
        print(f"{'=' * 70}\n")

    def test_connection(self):
        print(f"\n🔍 测试连接...")
        test_url = f"{self.base_url}/index.html"
        print(f"   URL: {test_url}")

        content = self.download_file(test_url)
        if not content:
            print(f"   ❌ 无法访问")
            return False

        text = content.decode('utf-8', errors='ignore')
        if '404' in text and 'Page Not Found' in text:
            print(f"   ❌ 返回404")
            return False

        # 显示清理前后对比
        print(f"   ✅ 连接成功")
        print(f"   原始大小: {len(content)} 字节")

        cleaned = self.clean_html(content)
        print(f"   清理后: {len(cleaned)} 字节")
        print(f"   移除了: {len(content) - len(cleaned)} 字节的注入内容")

        return True

    def check_updates(self):
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n{'=' * 70}")
        print(f"⏰ [{timestamp}] 检查更新")
        print(f"{'=' * 70}")

        index_url = f"{self.base_url}/index.html"
        remote_content = self.download_file(index_url)

        if not remote_content:
            print("❌ 无法访问")
            return False

        text = remote_content.decode('utf-8', errors='ignore')
        if '404' in text and 'Page Not Found' in text:
            print("❌ 返回404")
            print(f"💡 URL: {index_url}")
            return False

        # 清理后计算哈希
        cleaned_content = self.clean_html(remote_content)
        remote_hash = self.get_file_hash(cleaned_content)

        local_file = self.local_path / 'index.html'
        local_hash = self.get_local_file_hash(local_file)

        if local_hash != remote_hash:
            print(f"✨ 检测到变化！")
            if local_hash:
                print(f"   本地: {local_hash[:16]}...")
                print(f"   远程: {remote_hash[:16]}...")
            else:
                print(f"   首次同步")

            self.backup()
            auto_detect = local_hash is not None
            self.sync_project(auto_detect=auto_detect)
            return True
        else:
            print("✓ 无变化")
            return False

    def backup(self):
        if not self.local_path.exists():
            return

        has_content = any(item.name != '.file_hashes.json'
                          for item in self.local_path.iterdir())
        if not has_content:
            return

        try:
            backup_name = f"{self.local_path.name}_backup_{time.strftime('%Y%m%d_%H%M%S')}"
            backup_path = self.local_path.parent / backup_name
            print(f"\n💾 备份: {backup_name}")
            shutil.copytree(self.local_path, backup_path,
                            ignore=shutil.ignore_patterns('.file_hashes.json'))
        except Exception as e:
            print(f"   备份失败: {e}")

    def start(self):
        print("=" * 70)
        print("🚀 项目镜像同步器 (HTML净化版)")
        print("=" * 70)
        print(f"📡 远程: {self.base_url}")
        print(f"💾 本地: {self.local_path}")
        print(f"⏱️  间隔: {self.check_interval}秒")
        print(f"🧹 自动清理LiveReload等注入脚本")
        print(f"⌨️  Ctrl+C 停止")
        print("=" * 70)

        if not self.test_connection():
            print("\n❌ 连接失败")
            return

        print("\n🔍 首次同步...")
        self.check_updates()

        print(f"\n👀 开始监控...\n")

        while True:
            try:
                time.sleep(self.check_interval)
                self.check_updates()
            except KeyboardInterrupt:
                print("\n\n" + "=" * 70)
                print("👋 已停止")
                print("=" * 70)
                break
            except Exception as e:
                print(f"\n❌ 错误: {e}")
                print("⏳ 继续监控...\n")


def main():
    # ==================== 配置 ====================
    REMOTE_URL = "http://172.16.229.130:8848/7-2(1)"
    LOCAL_PATH = r"C:\Users\Administrator\Documents\HBuilderProjects\7-2(1)-1"
    CHECK_INTERVAL = 60
    # =============================================

    print("\n" + "=" * 70)
    print("📋 配置")
    print("=" * 70)
    print(f"远程: {REMOTE_URL}")
    print(f"本地: {LOCAL_PATH}")
    print(f"间隔: {CHECK_INTERVAL}秒")
    print("=" * 70)

    try:
        confirm = input("\n开始同步？(回车继续 / n取消): ").strip().lower()
        if confirm == 'n':
            return
    except:
        pass

    syncer = ProjectMirrorSync(REMOTE_URL, LOCAL_PATH, CHECK_INTERVAL)
    syncer.start()


if __name__ == "__main__":
    main()