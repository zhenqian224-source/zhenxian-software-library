'use strict';

const softwareSeed = [
  {
    slug: 'obsidian',
    name: 'Obsidian',
    tagline: '让想法自然生长为知识网络。',
    description: `Obsidian 是一款以本地 Markdown 文件为核心的笔记与知识管理工具。你写下的一切都保存在自己的文件夹中，可以随时备份、迁移，或用其他编辑器打开。

双向链接、画布、标签和插件系统，让零散的想法逐渐连成一张属于自己的知识地图。它更像一块可以长期生长的空间，而不是一个替你决定结构的应用。`,
    category: '效率',
    platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    website: 'https://obsidian.md',
    version: '1.9.14',
    size: '126 MB',
    license: '免费增值',
    developer: 'Obsidian Team',
    accent: '#8B7CFF',
    icon: 'gem',
    tags: ['知识管理', 'Markdown', '本地优先'],
    highlights: [
      '本地优先：所有笔记都是可迁移的 Markdown 文件',
      '双向链接与关系图谱，让知识自然连接',
      '插件生态丰富，可以按自己的方式生长'
    ],
    editorNote: '它最好的地方，是用了很久之后，你依然拥有全部数据。',
    featured: 1,
    downloads: 48620,
    views: 12840,
    addedAt: '2026-08-14'
  },
  {
    slug: 'raycast',
    name: 'Raycast',
    tagline: '把每一次操作，压缩成一个快捷键。',
    description: `Raycast 把搜索、窗口管理、剪贴板历史、快捷指令和大量扩展压缩到同一个快捷键入口。它真正节省的不是几次点击，而是你从思路切到操作、再切回来的注意力。

内置的脚本与扩展 API 让它可以适配个人习惯，从查词、换算到控制智能家居，都能留在键盘上完成。`,
    category: '效率',
    platforms: ['macOS', 'Windows'],
    website: 'https://raycast.com',
    version: '1.99.2',
    size: '94 MB',
    license: '免费增值',
    developer: 'Raycast Technologies',
    accent: '#FF6B5E',
    icon: 'bolt',
    tags: ['启动器', '效率', '快捷键'],
    highlights: [
      '一个快捷键，接管搜索、剪贴板与窗口管理',
      '扩展商店覆盖开发、写作和日常查询',
      '脚本命令让重复操作变成一次回车'
    ],
    editorNote: '当肌肉记忆形成之后，你会忘记自己在使用一个工具。',
    featured: 2,
    downloads: 32840,
    views: 10220,
    addedAt: '2026-08-21'
  },
  {
    slug: 'arc',
    name: 'Arc',
    tagline: '一个更安静、更有秩序的浏览器。',
    description: `Arc 用侧边栏、空间和分栏重新整理了浏览器的信息层级。你可以把工作、学习和生活分进不同空间，让标签页不再堆成一条无法阅读的长河。

Little Arc 适合临时查资料，Boosts 可以微调任意网页。它试图让浏览器更安静，也更接近你思考的顺序。`,
    category: '效率',
    platforms: ['macOS', 'Windows'],
    website: 'https://arc.net',
    version: '1.74.0',
    size: '218 MB',
    license: '免费',
    developer: 'The Browser Company',
    accent: '#F3A064',
    icon: 'arc',
    tags: ['浏览器', '工作空间', '专注'],
    highlights: [
      '空间与侧边栏，重新组织标签页',
      'Little Arc 让临时浏览不打断当前工作',
      'Boosts 可以为任意网站换一套样式'
    ],
    editorNote: '它不试图装下更多网页，而是帮你放下不必要的网页。',
    featured: 0,
    downloads: 18320,
    views: 7620,
    addedAt: '2026-08-28'
  },
  {
    slug: 'figma',
    name: 'Figma',
    tagline: '设计不止于画布，协作正在发生。',
    description: `Figma 把设计文件放进浏览器，让多人实时协作成为默认状态。评论、原型、设计系统和开发标注可以在同一个文件里完成。

自动布局、变量和组件库让改稿不再依赖重复劳动。对独立设计师和小团队来说，它降低了从想法到可交付界面的距离。`,
    category: '创作',
    platforms: ['Web', 'macOS', 'Windows'],
    website: 'https://www.figma.com',
    version: 'Web',
    size: '无需安装',
    license: '免费增值',
    developer: 'Figma',
    accent: '#A879FF',
    icon: 'shapes',
    tags: ['设计', '协作', '原型'],
    highlights: [
      '浏览器内实时协作，告别文件传来传去',
      '自动布局和组件变体，让设计系统真正可用',
      '从线框到原型，在一个文件里完成'
    ],
    editorNote: '协作不是功能，而应该是设计工具默认发生的状态。',
    featured: 3,
    downloads: 57100,
    views: 15480,
    addedAt: '2026-09-02'
  },
  {
    slug: 'blender',
    name: 'Blender',
    tagline: '从第一颗像素，到完整的 3D 世界。',
    description: `Blender 覆盖建模、雕刻、材质、动画、渲染和视频剪辑的完整 3D 工作流，并且完全开源免费。

从独立动画到产品可视化，它被大量工作室用于正式项目。陡峭的学习曲线背后，是一个几乎不设上限的创作工具箱。`,
    category: '创作',
    platforms: ['Windows', 'macOS', 'Linux'],
    website: 'https://www.blender.org',
    version: '4.4 LTS',
    size: '334 MB',
    license: '开源免费',
    developer: 'Blender Foundation',
    accent: '#F5833B',
    icon: 'cube',
    tags: ['3D', '建模', '开源'],
    highlights: [
      '完整覆盖建模、动画、渲染与合成',
      '开源免费，商业项目也可使用',
      '几何节点带来程序化创作的自由'
    ],
    editorNote: '免费并不意味着妥协，它已经撑起了无数正式作品。',
    featured: 4,
    downloads: 42680,
    views: 11240,
    addedAt: '2026-09-06'
  },
  {
    slug: 'obs-studio',
    name: 'OBS Studio',
    tagline: '把屏幕里的每一刻，稳稳记录下来。',
    description: `OBS Studio 是开源的直播与录制工作台。场景、来源、音频混合和转场都可以自由组合，适合从会议录屏到多机位直播的不同场景。

插件生态补足了虚拟摄像头、回放和高级音频处理等能力。配置一次之后，它会安静地待在后台，把注意力留给内容本身。`,
    category: '影音',
    platforms: ['Windows', 'macOS', 'Linux'],
    website: 'https://obsproject.com',
    version: '31.0.3',
    size: '172 MB',
    license: '开源免费',
    developer: 'OBS Project',
    accent: '#7280FF',
    icon: 'broadcast',
    tags: ['直播', '录屏', '开源'],
    highlights: [
      '多场景切换与独立音轨管理',
      '支持直播、录屏与虚拟摄像头',
      '插件生态覆盖专业工作流'
    ],
    editorNote: '看起来朴素，却几乎能胜任所有与画面采集有关的事情。',
    featured: 0,
    downloads: 51240,
    views: 13860,
    addedAt: '2026-09-10'
  },
  {
    slug: 'vscode',
    name: 'Visual Studio Code',
    tagline: '轻巧，却足以承载你的整个工程。',
    description: `Visual Studio Code 是一款轻量但高度可扩展的代码编辑器。内置 Git、终端、调试器和智能补全，开箱就能覆盖大多数开发任务。

扩展市场几乎覆盖所有语言与框架，Remote SSH、Dev Containers 等功能让本地编辑体验延伸到远程环境。`,
    category: '开发',
    platforms: ['Windows', 'macOS', 'Linux'],
    website: 'https://code.visualstudio.com',
    version: '1.101',
    size: '112 MB',
    license: '免费',
    developer: 'Microsoft',
    accent: '#3E9BFF',
    icon: 'code',
    tags: ['代码编辑', '开发', '插件'],
    highlights: [
      '内置 Git、终端与调试器',
      '扩展生态覆盖几乎所有语言',
      'Remote SSH 与容器开发体验成熟'
    ],
    editorNote: '它当然不是最轻的编辑器，但几乎是最不需要解释的那一个。',
    featured: 0,
    downloads: 73850,
    views: 18920,
    addedAt: '2026-09-13'
  },
  {
    slug: 'localsend',
    name: 'LocalSend',
    tagline: '不经过云端，把文件送到身边的设备。',
    description: `LocalSend 让同一局域网内的设备直接互传文件，不经过云端，也不需要注册账号。手机、电脑和平板只要安装客户端，就能互相发现。

它开源、跨平台，传输速度取决于本地网络。对于大文件、隐私敏感资料或没有网络的场景，它是一个足够简单可靠的方案。`,
    category: '系统',
    platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    website: 'https://localsend.org',
    version: '1.17.0',
    size: '38 MB',
    license: '开源免费',
    developer: 'LocalSend',
    accent: '#36C9A5',
    icon: 'send',
    tags: ['文件传输', '局域网', '开源'],
    highlights: [
      '局域网直传，文件不经过云端',
      'Windows、macOS、Linux、iOS、Android 全平台',
      '开源可自建，无账号也可使用'
    ],
    editorNote: '没有账号体系，没有云端上传，只有两台设备之间的一条直线。',
    featured: 0,
    downloads: 29410,
    views: 8460,
    addedAt: '2026-09-18'
  },
  {
    slug: 'zed',
    name: 'Zed',
    tagline: '为速度而生的多人协作代码编辑器。',
    description: `Zed 是一款用 Rust 编写的高性能代码编辑器，强调启动速度、输入延迟和多人协作。

内置的协同编辑、多光标和 AI 辅助功能围绕键盘工作流设计。它仍在快速迭代，但已经把「编辑器应该有多快」重新拉回讨论中心。`,
    category: '开发',
    platforms: ['macOS', 'Linux'],
    website: 'https://zed.dev',
    version: '0.190',
    size: '64 MB',
    license: '开源免费',
    developer: 'Zed Industries',
    accent: '#F2C55C',
    icon: 'zed',
    tags: ['代码编辑', '协作', 'Rust'],
    highlights: [
      'Rust 原生性能，输入响应极快',
      '多人协同编辑像在同一块屏幕上',
      '内置 AI 与多光标工作流'
    ],
    editorNote: '打开它的一瞬间，你会重新意识到编辑器也可以没有等待。',
    featured: 0,
    downloads: 12780,
    views: 6420,
    addedAt: '2026-09-24'
  },
  {
    slug: 'everything',
    name: 'Everything',
    tagline: '输入几个字母，文件立刻出现在眼前。',
    description: `Everything 通过读取 NTFS 文件索引，让 Windows 上的文件名搜索几乎即时返回结果。安装包只有几 MB，常驻占用也很低。

它支持通配符、正则和筛选语法，可以按路径、大小、修改时间精确定位文件。对经常整理资料的人来说，几乎是装完就离不开的工具。`,
    category: '系统',
    platforms: ['Windows'],
    website: 'https://www.voidtools.com',
    version: '1.4.1',
    size: '3 MB',
    license: '免费',
    developer: 'voidtools',
    accent: '#FF914D',
    icon: 'search',
    tags: ['文件搜索', 'Windows', '轻量'],
    highlights: [
      '毫秒级文件名搜索',
      '占用极低，安装包只有几 MB',
      '支持通配符、正则与高级筛选'
    ],
    editorNote: '一个体积不到 3 MB 的工具，改变了 Windows 上找文件的方式。',
    featured: 0,
    downloads: 66120,
    views: 16420,
    addedAt: '2026-09-27'
  },
  {
    slug: 'iina',
    name: 'IINA',
    tagline: 'macOS 上，恰到好处的现代播放器。',
    description: `IINA 是一款为 macOS 打造的现代视频播放器。它遵循系统设计语言，支持触控板手势、画中画、外挂字幕和网络串流。

底层基于 mpv，格式兼容性和播放性能都很扎实。界面没有多余装饰，适合把注意力放回画面。`,
    category: '影音',
    platforms: ['macOS'],
    website: 'https://iina.io',
    version: '1.4.0',
    size: '82 MB',
    license: '开源免费',
    developer: 'IINA',
    accent: '#61C9FF',
    icon: 'play',
    tags: ['播放器', 'macOS', '开源'],
    highlights: [
      '原生 macOS 体验与触控板手势',
      '基于 mpv，格式兼容性强',
      '画中画、字幕与网络串流齐全'
    ],
    editorNote: '没有多余的按钮，也没有缺失的功能，这就是「恰到好处」。',
    featured: 0,
    downloads: 21870,
    views: 7220,
    addedAt: '2026-10-02'
  },
  {
    slug: 'pixpin',
    name: 'PixPin',
    tagline: '截图、贴图、OCR，一次完成。',
    description: `PixPin 把截图、长截图、贴图、OCR 和录屏放进一个轻量工具里。截图后可以直接钉在屏幕最上层，方便对照资料或还原设计。

它支持 Windows 与 macOS，快捷键和标注工具都可以按习惯调整，适合需要频繁捕捉屏幕内容的人。`,
    category: '效率',
    platforms: ['Windows', 'macOS'],
    website: 'https://pixpin.cn',
    version: '1.9.8',
    size: '31 MB',
    license: '免费',
    developer: 'PixPin',
    accent: '#FF8095',
    icon: 'crop',
    tags: ['截图', 'OCR', '贴图'],
    highlights: [
      '截图、长截图与贴图一站式完成',
      '内置 OCR，图片文字直接复制',
      '标注工具与快捷键高度可定制'
    ],
    editorNote: '截图之后不用再切软件，这是它最朴素也最有效的价值。',
    featured: 0,
    downloads: 15640,
    views: 5840,
    addedAt: '2026-10-08'
  },
  {
    slug: 'notion',
    name: 'Notion',
    tagline: '文档、项目与知识，共享同一个空间。',
    description: `Notion 把文档、数据库、看板和知识库放在同一套积木式编辑器里。团队可以用它搭建项目主页、会议记录和内容日历。

页面之间可以自由嵌套，数据库视图也能按不同角色切换。它更适合作为团队的信息入口，而不是单纯的文本编辑器。`,
    category: '效率',
    platforms: ['Web', 'macOS', 'Windows', 'iOS', 'Android'],
    website: 'https://www.notion.so',
    version: 'Web',
    size: '无需安装',
    license: '免费增值',
    developer: 'Notion Labs',
    accent: '#C7CEC8',
    icon: 'notion',
    tags: ['协作', '知识库', '文档'],
    highlights: [
      '文档、数据库与看板自由组合',
      '页面嵌套，适合搭建团队知识库',
      '多视图切换，同一份数据多种用法'
    ],
    editorNote: '它最大的风险是让人花太多时间整理系统，而忘了真正做事。',
    featured: 0,
    downloads: 39420,
    views: 11980,
    addedAt: '2026-10-12'
  }
];

const usersSeed = [
  {
    username: 'demo',
    password: 'demo1234',
    displayName: '林墨',
    bio: '把工具调成顺手的样子，然后忘记它。',
    avatarColor: '#C7F464',
    role: 'admin',
    daysAgo: 180
  },
  {
    username: 'nora',
    password: 'library2026',
    displayName: 'Nora',
    bio: '设计师，长期观察数字产品。',
    avatarColor: '#B69CFF',
    role: 'member',
    daysAgo: 160
  },
  {
    username: 'muhan',
    password: 'library2026',
    displayName: '木涵',
    bio: '独立开发者，喜欢小而美的工具。',
    avatarColor: '#72D9FF',
    role: 'member',
    daysAgo: 150
  },
  {
    username: 'alan',
    password: 'library2026',
    displayName: '阿岚',
    bio: '影音与 3D 爱好者。',
    avatarColor: '#FF9C76',
    role: 'member',
    daysAgo: 140
  },
  {
    username: 'tang',
    password: 'library2026',
    displayName: '糖纸',
    bio: '学生党，效率工具收集癖。',
    avatarColor: '#F59AC4',
    role: 'member',
    daysAgo: 120
  }
];

const commentsSeed = [
  {
    slug: 'obsidian',
    user: 'nora',
    rating: 5,
    daysAgo: 3,
    content: '用了三年，最打动我的不是功能，而是它从不打扰。所有笔记都躺在本地文件夹里，这种掌控感很难被替代。',
    likedBy: ['demo', 'muhan', 'tang']
  },
  {
    slug: 'obsidian',
    user: 'muhan',
    rating: 4,
    daysAgo: 7,
    content: '插件生态是双刃剑，折腾配置会花时间；但一旦搭好自己的工作流，确实回不去。建议先想清楚自己的工作流，再装插件。',
    likedBy: ['nora']
  },
  {
    slug: 'obsidian',
    user: 'demo',
    rating: 5,
    daysAgo: 12,
    content: '年度复盘和项目资料都在里面。建议新用户先别装插件，用满一个月再决定需要什么。',
    likedBy: ['tang', 'muhan']
  },
  {
    slug: 'obsidian',
    user: 'tang',
    rating: 4,
    daysAgo: 19,
    content: '手机上主要用来看和快速记录，桌面端才是主场。官方同步价格略高，学生党可以先用 Git 方案过渡。',
    likedBy: []
  },
  {
    slug: 'raycast',
    user: 'alan',
    rating: 5,
    daysAgo: 2,
    content: '快捷键已经成了肌肉记忆，剪贴板历史、窗口管理、翻译都在一个入口解决。现在打开 Mac 第一件事就是按空格。',
    likedBy: ['demo', 'nora']
  },
  {
    slug: 'raycast',
    user: 'muhan',
    rating: 5,
    daysAgo: 9,
    content: '扩展开发文档写得很清楚，我给团队写了个内部工具，十分钟就跑通了。免费版对个人已经非常够用。',
    likedBy: ['alan']
  },
  {
    slug: 'raycast',
    user: 'tang',
    rating: 4,
    daysAgo: 16,
    content: '刚上手需要花一个下午记快捷键，过了适应期效率提升明显。Pro 的 AI 功能看个人需求，不必急着订阅。',
    likedBy: []
  },
  {
    slug: 'arc',
    user: 'nora',
    rating: 4,
    daysAgo: 4,
    content: '空间和分栏的思路很新，适合同时处理几摊事。不过资源占用比想象中高，旧电脑上会有点吃力。',
    likedBy: ['demo']
  },
  {
    slug: 'arc',
    user: 'demo',
    rating: 5,
    daysAgo: 10,
    content: '最喜欢 Little Arc 的轻量弹窗，临时查资料不会打乱当前页面。这个交互值得所有浏览器学习。',
    likedBy: ['nora', 'tang']
  },
  {
    slug: 'arc',
    user: 'alan',
    rating: 5,
    daysAgo: 24,
    content: '从 Chrome 迁过来一周就适应了，侧边栏一旦用惯就回不去。希望后续更新能继续克制一点。',
    likedBy: []
  },
  {
    slug: 'figma',
    user: 'nora',
    rating: 5,
    daysAgo: 5,
    content: '协作体验依然是行业标杆，多人同时改一个文件没有割裂感。设计系统一旦搭好，交付效率提升非常明显。',
    likedBy: ['demo', 'tang', 'muhan']
  },
  {
    slug: 'figma',
    user: 'tang',
    rating: 5,
    daysAgo: 14,
    content: '学生认证后免费版足够用。自动布局熟练之后，改稿速度快很多，建议新手尽早练习组件和变量。',
    likedBy: ['nora']
  },
  {
    slug: 'blender',
    user: 'alan',
    rating: 5,
    daysAgo: 6,
    content: '开源软件能做到这个完成度，本身就是一个奇迹。2.8 之后的界面对新手友好了太多，教程生态也非常完整。',
    likedBy: ['muhan', 'demo']
  },
  {
    slug: 'blender',
    user: 'muhan',
    rating: 5,
    daysAgo: 13,
    content: '命令行渲染和 Python 脚本是隐藏王牌，适合批量出图。插件装得克制一点，稳定性会好很多。',
    likedBy: ['alan']
  },
  {
    slug: 'blender',
    user: 'tang',
    rating: 4,
    daysAgo: 21,
    content: '第一次打开确实会被劝退，跟着甜甜圈教程做完就有感觉了。快捷键多，但形成肌肉记忆后很顺。',
    likedBy: []
  },
  {
    slug: 'obs-studio',
    user: 'alan',
    rating: 5,
    daysAgo: 8,
    content: '录屏、直播、虚拟摄像头一套搞定，社区插件也丰富。记得把桌面音频和麦克风分成两条音轨，后期会方便很多。',
    likedBy: ['demo']
  },
  {
    slug: 'obs-studio',
    user: 'demo',
    rating: 4,
    daysAgo: 18,
    content: '开会录屏前记得先试一次音轨。默认设置能跑，但想录得干净还是要花十分钟配置。',
    likedBy: ['alan']
  },
  {
    slug: 'vscode',
    user: 'muhan',
    rating: 5,
    daysAgo: 7,
    content: '扩展生态无人能敌，Remote SSH 让我在平板上也能改代码。配置同步之后换机基本无痛。',
    likedBy: ['demo', 'nora']
  },
  {
    slug: 'vscode',
    user: 'demo',
    rating: 5,
    daysAgo: 15,
    content: '启动速度比几年前快了很多。建议把常用命令放进命令面板，少用鼠标，体验会好很多。',
    likedBy: ['muhan']
  },
  {
    slug: 'vscode',
    user: 'tang',
    rating: 4,
    daysAgo: 26,
    content: '新手别一上来装几十个插件。先把快捷键和命令面板用熟，再按实际需要扩展，否则很快会变卡。',
    likedBy: []
  },
  {
    slug: 'localsend',
    user: 'tang',
    rating: 5,
    daysAgo: 3,
    content: '宿舍里传文件神器，不注册、不限速，iPhone 和 Windows 互传很稳。比在聊天软件里传来传去舒服太多。',
    likedBy: ['demo', 'alan']
  },
  {
    slug: 'localsend',
    user: 'muhan',
    rating: 5,
    daysAgo: 11,
    content: '跨平台、无云端依赖，开源还可自建。唯一要提醒的是首次使用记得放行防火墙，不然设备互相发现不了。',
    likedBy: ['demo']
  },
  {
    slug: 'localsend',
    user: 'nora',
    rating: 5,
    daysAgo: 20,
    content: '给同事传设计稿大文件很方便，没有 IM 压缩画质的问题。界面也足够简单，不需要教怎么用。',
    likedBy: []
  },
  {
    slug: 'zed',
    user: 'muhan',
    rating: 4,
    daysAgo: 9,
    content: '原生性能很好，多光标和协同编辑很丝滑。插件生态还在追赶，但核心编辑体验已经足够让人愿意试用。',
    likedBy: ['demo']
  },
  {
    slug: 'zed',
    user: 'demo',
    rating: 5,
    daysAgo: 17,
    content: '界面克制，启动几乎瞬间。希望 Windows 版快点稳定，这样就能作为主力编辑器了。',
    likedBy: ['muhan']
  },
  {
    slug: 'everything',
    user: 'demo',
    rating: 5,
    daysAgo: 4,
    content: 'Windows 必装第一名。改文件名、找旧文档，基本都是秒出。装完之后很难想象没有它的日子。',
    likedBy: ['tang', 'alan', 'muhan']
  },
  {
    slug: 'everything',
    user: 'tang',
    rating: 5,
    daysAgo: 12,
    content: '占用极小，学会几个搜索语法之后效率翻倍。用它替代资源管理器里的搜索框完全够用。',
    likedBy: ['demo']
  },
  {
    slug: 'everything',
    user: 'alan',
    rating: 5,
    daysAgo: 22,
    content: '配合自定义快捷键，几乎替代了资源管理器里的搜索框。索引重建速度也很快，没什么可挑剔的。',
    likedBy: []
  },
  {
    slug: 'iina',
    user: 'alan',
    rating: 5,
    daysAgo: 6,
    content: 'macOS 上最顺手的播放器，触控板手势和外挂字幕体验都很好。用来看课程和蓝光都很舒服。',
    likedBy: ['nora']
  },
  {
    slug: 'iina',
    user: 'nora',
    rating: 4,
    daysAgo: 16,
    content: '界面和系统风格一致，画中画看教程很舒服。如果再多一些视频色彩调节选项就更完整了。',
    likedBy: []
  },
  {
    slug: 'pixpin',
    user: 'nora',
    rating: 5,
    daysAgo: 5,
    content: '截图后直接贴在最上层对照，做设计还原时特别有用。长截图识别也比浏览器插件稳定。',
    likedBy: ['demo', 'tang']
  },
  {
    slug: 'pixpin',
    user: 'tang',
    rating: 4,
    daysAgo: 14,
    content: 'OCR 和长截图都集成在一起，少装三个软件。希望 macOS 版的自定义快捷键再丰富一些。',
    likedBy: ['nora']
  },
  {
    slug: 'notion',
    user: 'nora',
    rating: 4,
    daysAgo: 8,
    content: '团队 wiki 和项目看板在一个页面里，信息不再散落。缺点是页面一多，加载速度会有明显下降。',
    likedBy: ['demo']
  },
  {
    slug: 'notion',
    user: 'demo',
    rating: 4,
    daysAgo: 23,
    content: '适合搭建轻量知识库，数据库视图很灵活。离线体验还是短板，重要资料记得另做备份。',
    likedBy: ['nora']
  }
];

module.exports = { softwareSeed, usersSeed, commentsSeed };
