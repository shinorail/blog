document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 機能1: ハンバーガーメニュー制御
    // ==========================================
    const trigger = document.getElementById('menu-trigger');
    const menu = document.getElementById('nav-menu');
    trigger.addEventListener('click', () => {
        trigger.classList.toggle('active');
        menu.classList.toggle('active');
    });

    // ==========================================
    // 機能2: ダークモード切り替え ＆ 設定保存
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerText = '☀️';
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerText = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // ==========================================
    // 機能3: PRヘッダー（お知らせ）の読み込み
    // ==========================================
    fetch('pages/news.md')
        .then(res => { if (!res.ok) throw new Error(); return res.text(); })
        .then(text => { document.getElementById('pr-news-text').innerText = text.trim(); })
        .catch(() => { document.getElementById('pr-news-text').innerText = "鉄道趣味の記録を更新中！"; });

    // ==========================================
    // メインロジック: パラメータ解析 ＆ コンテンツ制御
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const postName = urlParams.get('post');
    const pageName = urlParams.get('page');
    let allPosts = []; // 検索用に記事全件を保持する配列

    // 記事リストの自動生成データを読み込む
    fetch('posts-list.json')
        .then(res => res.json())
        .then(posts => {
            allPosts = posts;
            renderPostsList(allPosts);

            // トップページアクセス時は、最新の記事（リストの先頭）を表示
            if (!postName && !pageName && posts.length > 0) {
                loadContent(`posts/${posts[0]}.md`, true);
            }
        })
        .catch(() => {
            document.getElementById('posts-list').innerHTML = '<li>記事リストを読み込めませんでした。</li>';
        });

    // 各個別ページの出し分け
    if (postName) {
        loadContent(`posts/${postName}.md`, true);
    } else if (pageName) {
        loadContent(`pages/${pageName}.md`, false); // 固定ページは読了・シェア非表示
    }

    // 記事リストを画面に描画する処理
    function renderPostsList(postsArray) {
        const listElement = document.getElementById('posts-list');
        listElement.innerHTML = '';
        if (postsArray.length === 0) {
            listElement.innerHTML = '<li>見つかりませんでした</li>';
            return;
        }
        postsArray.forEach(post => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="?post=${post}">${post}</a>`;
            listElement.appendChild(li);
        });
    }

    // ==========================================
    // 機能4: 簡易記事検索（絞り込み）機能
    // ==========================================
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = allPosts.filter(post => post.toLowerCase().includes(keyword));
        renderPostsList(filtered);
    });

    // ==========================================
    // コア機能: Markdown読み込み ＆ 拡張機能連動
    // ==========================================
    function loadContent(path, isArticle) {
        fetch(path)
            .then(res => { if (!res.ok) throw new Error(); return res.text(); })
            .then(markdown => {
                // HTMLへの変換・表示
                document.getElementById('content').innerHTML = marked.parse(markdown);

                if (isArticle) {
                    // 機能5: 読了時間の予測計算 (1分に400文字読むと想定)
                    const textLength = markdown.replace(/[#\-\*\s`\[\]\(\)]/g, '').length;
                    const readTime = Math.ceil(textLength / 400);
                    const badge = document.getElementById('read-time-badge');
                    badge.innerText = `⏱️ この記事は約 ${readTime} 分で読めます`;
                    badge.style.display = 'inline-block';

                    // 機能6: SNSシェアボタンのURL生成
                    const pageUrl = encodeURIComponent(window.location.href);
                    const pageTitle = encodeURIComponent(document.title + " | 篠ノ井乗務区ブログ");
                    document.getElementById('share-x').href = `https://x.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
                    document.getElementById('share-line').href = `https://social-plugins.line.me/lineit/share?url=${pageUrl}`;
                    document.getElementById('share-buttons').style.display = 'block';
                } else {
                    // 固定ページの場合は読了時間・シェアを隠す
                    document.getElementById('read-time-badge').style.display = 'none';
                    document.getElementById('share-buttons').style.display = 'none';
                }
            })
            .catch(() => {
                document.getElementById('content').innerHTML = '<h2>404</h2><p>お探しのページが見つかりませんでした。</p>';
                document.getElementById('read-time-badge').style.display = 'none';
                document.getElementById('share-buttons').style.display = 'none';
            });
    }
});
