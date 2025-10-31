import urllib.request
import urllib.error
import time
import hashlib
import shutil
from pathlib import Path
import json
import re
import sys


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
        """清理HTML中注入的脚本"""
        try:
            text = content.decode('utf-8', errors='ignore')
            html_end = text.find('</html>')
            if html_end != -1:
                html_end_tag = html_end + len('</html>')
                text = text[:html_end_tag]

            text = re.sub(
                r'(</body>\s*)<script>.*?livereload.*?</script>\s*(<script>.*?</script>\s*)*\s*(</html>)',
                r'\1\3',
                text,
                flags=re.DOTALL | re.IGNORECASE
            )

            patterns = [
                r'<script>document\.write\(.*?livereload\.js.*?\)</script>',
                r'<script>\s*document\.addEventListener\(.*?LiveReloadDisconnect.*?\)</script>',
                r'<script>\s*class\s+reloadPlugin.*?</script>',
                r'<script[^>]*src=["\'][^"\']*livereload\.js[^"\']*["\'][^>]*></script>',
                r'<script[^>]*src=["\'][^"\']*:35929[^"\']*["\'][^>]*></script>',
            ]

            for pattern in patterns:
                text = re.sub(pattern, '', text, flags=re.DOTALL | re.IGNORECASE)

            text = re.sub(r'(</html>).*$', r'\1', text, flags=re.DOTALL)
            text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
            text = text.strip()
            if not text.endswith('</html>'):
                text += '\n</html>'

            return text.encode('utf-8')
        except Exception as e:
            print(f"    清理HTML失败: {e}")
            return content

    def compare_and_download(self, remote_path):
        """对比并下载文件"""
        url = f"{self.base_url}/{remote_path}" if remote_path else self.base_url
        file_icon = self.get_file_icon(remote_path or 'index.html')
        local_file = self.local_path / (remote_path or 'index.html')

        remote_content = self.download_file(url)
        if not remote_content:
            print(f"  ❌ {file_icon} {remote_path or 'index.html'}")
            self.stats['failed'] += 1
            return False

        text = remote_content.decode('utf-8', errors='ignore')
        if '404' in text and 'Page Not Found' in text:
            print(f"  ❌ {file_icon} {remote_path or 'index.html'} (404)")
            self.stats['failed'] += 1
            return False

        if (remote_path or 'index.html').endswith(('.html', '.htm')):
            remote_content = self.clean_html(remote_content)

        remote_hash = self.get_file_hash(remote_content)
        local_hash = self.get_local_file_hash(local_file)
        stored_hash = self.file_hashes.get(remote_path or 'index.html')

        if local_hash == remote_hash and stored_hash == remote_hash:
            print(f"  ⏭️  {file_icon} {remote_path or 'index.html'} (未变化)")
            self.stats['skipped'] += 1
            return True

        try:
            local_file.parent.mkdir(parents=True, exist_ok=True)
            with open(local_file, 'wb') as f:
                f.write(remote_content)

            self.file_hashes[remote_path or 'index.html'] = remote_hash

            if local_hash is None:
                print(f"  ✨ {file_icon} {remote_path or 'index.html'} (新文件)")
            else:
                print(f"  🔄 {file_icon} {remote_path or 'index.html'} (已更新)")

            self.stats['downloaded'] += 1
            return True
        except Exception as e:
            print(f"  ❌ {file_icon} {remote_path or 'index.html'} - {e}")
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
                file_list = ['']
        else:
            file_list = ['']

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
        test_url = f"{self.base_url}"
        print(f"   URL: {test_url}")

        content = self.download_file(test_url)
        if not content:
            print(f"   ❌ 无法访问")
            return False

        text = content.decode('utf-8', errors='ignore')
        if '404' in text and 'Page Not Found' in text:
            print(f"   ❌ 返回404")
            return False

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

        index_url = f"{self.base_url}"
        remote_content = self.download_file(index_url)

        if not remote_content:
            print("❌ 无法访问")
            return False

        text = remote_content.decode('utf-8', errors='ignore')
        if '404' in text and 'Page Not Found' in text:
            print("❌ 返回404")
            print(f"💡 URL: {index_url}")
            return False

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

        try:
            has_content = any(item.name != '.file_hashes.json'
                              for item in self.local_path.iterdir())
            if not has_content:
                return
        except:
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
        print("\n" + "=" * 70)
        print("🚀 项目镜像同步器 (HTML净化版)")
        print("=" * 70)
        print(f"📡 远程: {self.base_url}")
        print(f"💾 本地: {self.local_path}")
        print(f"⏱️  间隔: {self.check_interval}秒")
        print(f"🧹 自动清理LiveReload等注入脚本")
        print(f"⌨️  Ctrl+C 停止")
        print("=" * 70)

        if not self.test_connection():
            print("\n❌ 连接失败，请检查URL是否正确")
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


# ============================================================================
# 配置管理函数
# ============================================================================

def load_config():
    """从文件加载配置"""
    config_file = Path('sync_config.json')
    if not config_file.exists():
        return None

    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except Exception as e:
        print(f"⚠️  读取配置失败: {e}")
        return None


def save_config(remote_url, local_path, check_interval):
    """保存配置到文件"""
    config = {
        'remote_url': remote_url,
        'local_path': str(local_path),
        'check_interval': check_interval,
        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }

    config_file = Path('sync_config.json')
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print(f"\n💾 配置已保存到: {config_file.resolve()}")
        return True
    except Exception as e:
        print(f"\n⚠️  保存配置失败: {e}")
        return False


def display_config_summary(remote_url, local_path, check_interval):
    """显示配置摘要"""
    print("\n" + "=" * 70)
    print("📋 配置摘要")
    print("=" * 70)
    print(f"📡 远程URL: {remote_url}")
    print(f"💾 本地路径: {local_path}")
    if check_interval >= 60:
        print(f"⏱️  检查间隔: {check_interval}秒 ({check_interval // 60}分钟)")
    else:
        print(f"⏱️  检查间隔: {check_interval}秒")
    print("=" * 70)


def get_user_input():
    """交互式获取用户配置"""
    print("\n" + "=" * 70)
    print("🎯 项目镜像同步器 - 配置向导")
    print("=" * 70)

    # 获取远程URL
    print("\n📡 步骤 1/3: 远程URL配置")
    print("=" * 70)
    print("💡 提示:")
    print("   - 完整的HTTP/HTTPS地址")
    print("   - 示例: http://192.168.1.100:8080/project/index.html")
    print("   - 示例: https://example.com/path/to/file.html")

    while True:
        remote_url = input("\n请输入远程URL: ").strip()
        if not remote_url:
            print("❌ URL不能为空，请重新输入")
            continue

            if not (remote_url.startswith('http://') or remote_url.startswith('https://')):
                print("❌ URL必须以 http:// 或 https:// 开头")
                continue

            print(f"✓ 已设置: {remote_url}")
            break

        # 获取本地路径
        print("\n💾 步骤 2/3: 本地保存路径")
        print("=" * 70)
        print("💡 提示:")
        print("   - 绝对路径或相对路径")
        print("   - Windows示例: D:\\Projects\\MyProject")
        print("   - Linux/Mac示例: /home/user/projects/myproject")
        print("   - 相对路径示例: ./downloads/project")

        while True:
            local_path = input("\n请输入本地路径: ").strip()
            if not local_path:
                print("❌ 路径不能为空，请重新输入")
                continue

            # 移除引号（如果用户复制路径时带了引号）
            local_path = local_path.strip('"').strip("'")

            try:
                path_obj = Path(local_path)
                # 显示绝对路径
                abs_path = path_obj.resolve()
                print(f"✓ 绝对路径: {abs_path}")

                # 如果路径不存在，询问是否创建
                if not path_obj.exists():
                    create = input(f"📁 路径不存在，是否创建? (Y/n): ").strip().lower()
                    if create == 'n':
                        print("❌ 已取消，请重新输入路径")
                        continue
                    try:
                        path_obj.mkdir(parents=True, exist_ok=True)
                        print(f"✓ 已创建目录: {abs_path}")
                    except Exception as e:
                        print(f"❌ 创建目录失败: {e}")
                        continue

                break

            except Exception as e:
                print(f"❌ 无效的路径: {e}")
                continue

        # 获取检查间隔
        print("\n⏱️  步骤 3/3: 检查间隔设置")
        print("=" * 70)
        print("💡 提示:")
        print("   - 单位：秒")
        print("   - 建议: 30-300秒")
        print("   - 默认: 60秒")

        while True:
            interval_input = input("\n请输入检查间隔 (直接回车使用默认60秒): ").strip()

            if not interval_input:
                check_interval = 60
                print(f"✓ 使用默认值: {check_interval}秒")
                break

            try:
                check_interval = int(interval_input)
                if check_interval < 5:
                    print("❌ 间隔太短，最少5秒")
                    continue
                if check_interval > 3600:
                    confirm = input(
                        f"⚠️  间隔较长({check_interval}秒={check_interval // 60}分钟)，确认? (Y/n): ").strip().lower()
                    if confirm == 'n':
                        continue
                print(f"✓ 已设置: {check_interval}秒")
                break
            except ValueError:
                print("❌ 请输入有效的数字")
                continue

        return remote_url, local_path, check_interval

    # ============================================================================
    # 主程序
    # ============================================================================

    def main():
        """主函数"""
        print("\n" + "=" * 70)
        print("🚀 项目镜像同步器启动")
        print("=" * 70)

        # 尝试加载已保存的配置
        saved_config = load_config()

        if saved_config:
            print("\n📄 检测到已保存的配置:")
            print("=" * 70)
            print(f"📡 远程URL: {saved_config.get('remote_url')}")
            print(f"💾 本地路径: {saved_config.get('local_path')}")
            print(f"⏱️  检查间隔: {saved_config.get('check_interval')}秒")
            if 'created_at' in saved_config:
                print(f"📅 创建时间: {saved_config.get('created_at')}")
            print("=" * 70)

            choice = input("\n使用已保存的配置? (Y/n/d=删除配置): ").strip().lower()

            if choice == 'd':
                try:
                    Path('sync_config.json').unlink()
                    print("✓ 配置已删除")
                    remote_url, local_path, check_interval = get_user_input()
                except Exception as e:
                    print(f"❌ 删除配置失败: {e}")
                    return
            elif choice == 'n':
                remote_url, local_path, check_interval = get_user_input()
            else:
                remote_url = saved_config.get('remote_url')
                local_path = saved_config.get('local_path')
                check_interval = saved_config.get('check_interval', 60)
        else:
            # 交互式输入
            remote_url, local_path, check_interval = get_user_input()

            # 询问是否保存配置
            save_choice = input("\n💾 是否保存此配置供下次使用? (Y/n): ").strip().lower()
            if save_choice != 'n':
                save_config(remote_url, local_path, check_interval)

        # 显示最终配置
        display_config_summary(remote_url, local_path, check_interval)

        # 确认开始
        try:
            confirm = input("\n✅ 开始同步? (回车继续 / n取消): ").strip().lower()
            if confirm == 'n':
                print("\n👋 已取消")
                return
        except KeyboardInterrupt:
            print("\n\n👋 已取消")
            return

        # 创建同步器并启动
        try:
            syncer = ProjectMirrorSync(remote_url, local_path, check_interval)
            syncer.start()
        except KeyboardInterrupt:
            print("\n\n👋 已停止")
        except Exception as e:
            print(f"\n❌ 运行错误: {e}")
            import traceback
            traceback.print_exc()

    if __name__ == "__main__":
        try:
            main()
        except KeyboardInterrupt:
            print("\n\n👋 程序已退出")
            sys.exit(0)
        except Exception as e:
            print(f"\n❌ 致命错误: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)