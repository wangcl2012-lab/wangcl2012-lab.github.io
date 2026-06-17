import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  Clapperboard,
  Copy,
  Database,
  FileText,
  Image,
  Lightbulb,
  Menu,
  MessageSquare,
  Palette,
  PenTool,
  Play,
  ScanSearch,
  Scissors,
  Sparkles,
  TrendingUp,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import {
  capabilities,
  experience,
  navigation,
  profile,
  projects,
  workflow,
} from "./data/portfolio";
import aiAestheticArticle from "./content/ai-aesthetic.md?raw";
import Lightfall from "./components/Lightfall";
import BorderGlow from "./components/BorderGlow";

const filters = [
  ["video", "视频"],
  ["image", "图片"],
  ["copy", "文案"],
  ["commercial", "商业项目"],
];

const imageWorkSections = [
  {
    id: "prompt",
    title: "AI+Prompt设计作品",
    summary: "把需求、场景、卖点和视觉风格拆成可执行提示词，适用于活动主视觉、服务海报、社媒封面、详情页等场景，帮助内容快速定制、快速出图、快速验证方向。",
  },
  {
    id: "handmade",
    title: "手搓设计作品",
    summary: "覆盖名片、折页、海报、邀请函、现场物料、详情页和节日视觉等传统平面设计场景，强调信息整理、版式控制和交付完整度。",
  },
];

const commercialWorkSections = [
  {
    id: "opc-ai",
    eyebrow: "COMMUNITY / AI SALON",
    title: "OPC + AI 线下活动沙龙",
    summary: "联合主理金陵厚生 OPC 工作室，围绕 OPC 与 AI 实践方向策划线下沙龙，并与阿里中心、南大、高企等机构和企业资源合作，把议题策划、现场组织、线上宣发和社群沉淀串成完整活动闭环。",
  },
  {
    id: "music",
    eyebrow: "COMMUNITY / LIVE MUSIC",
    title: "线下音乐会",
    summary: "发起并主理南京唱歌搭子音乐社群，与南京文旅、JLC 国金、金陵 style、览秀城等城市文化与商业空间合作，持续落地街唱、书店音乐会、商圈演出和主题粉丝派对，社群参与与传播累计突破 1 万人次。",
  },
];

const heroLightfallColors = ["#A6C8FF", "#5227FF", "#FF9FFC"];
const capabilityIcons = [FileText, Image, Video, ScanSearch, Bot, Database];
const workflowIcons = [Lightbulb, PenTool, Palette, Clapperboard, TrendingUp];
const toolIcons = {
  FCP: Clapperboard,
  PR: Clapperboard,
  剪映: Scissors,
  PS: Image,
  ChatGPT: MessageSquare,
  Image2: WandSparkles,
};

const articleSources = {
  "ai-aesthetic": aiAestheticArticle,
};

const articleImageBase = "/assets/articles/ai-aesthetic/";

function renderInlineText(text) {
  return text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, index) => (
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
      : part
  ));
}

function parseArticle(markdown) {
  const blocks = [];
  const lines = markdown.trim().split(/\r?\n/);
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      return;
    }
    if (line === "---") {
      flushParagraph();
      blocks.push({ type: "divider" });
      return;
    }
    const imageMatch = line.match(/^!\[(.*?)]\((.*?)\)$/);
    if (imageMatch) {
      flushParagraph();
      const filename = imageMatch[2].split("/").pop().replace(/\.png$/i, ".webp");
      blocks.push({ type: "image", alt: imageMatch[1], src: `${articleImageBase}${filename}` });
      return;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "heading3", text: line.slice(4) });
      return;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "heading2", text: line.slice(3) });
      return;
    }
    paragraph.push(line);
  });
  flushParagraph();
  return blocks;
}

const featuredModels = [
  { id: "claude", name: "Claude", provider: "ANTHROPIC" },
  { id: "chatgpt", name: "ChatGPT", provider: "OPENAI" },
  { id: "codex", name: "Codex", provider: "OPENAI" },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("video");
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeCapability, setActiveCapability] = useState(null);
  const [copiedContact, setCopiedContact] = useState("");

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.type === filter),
    [filter],
  );

  const visibleImageSections = useMemo(
    () => imageWorkSections.map((section) => ({
      ...section,
      projects: projects.filter((project) => project.type === "image" && project.imageGroup === section.id),
    })),
    [],
  );

  const visibleCommercialSections = useMemo(
    () => commercialWorkSections.map((section) => ({
      ...section,
      projects: projects.filter((project) => project.type === "commercial" && project.commercialGroup === section.id),
    })),
    [],
  );

  useEffect(() => {
    const revealItems = document.querySelectorAll("[data-reveal]:not(.is-visible)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -7% 0px",
      },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [filter]);

  useEffect(() => {
    document.body.style.overflow = selectedProject ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProject]);

  const copyContact = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopiedContact(key);
    window.setTimeout(() => {
      setCopiedContact((current) => (current === key ? "" : current));
    }, 1800);
  };

  return (
    <>
      <header className="site-header site-header-enter">
        <a className="brand" href="#top" aria-label="返回首页">
          <span>{profile.monogram}</span>
          <small>AI CREATIVE PORTFOLIO</small>
        </a>
        <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="主导航">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-contact" href="#contact">
          联系我 <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <Lightfall
            colors={heroLightfallColors}
            backgroundColor="#0A29FF"
            speed={0.5}
            streakCount={2}
            streakWidth={1}
            streakLength={1}
            glow={1}
            density={0.6}
            twinkle={1}
            zoom={3}
            backgroundGlow={0.5}
            opacity={1}
            mouseInteraction
            mouseStrength={0.5}
            mouseRadius={1}
            dpr={1.5}
            maxFps={30}
            className="hero-lightfall"
          />
          <div className="hero-shade" />
          <div className="hero-content page-shell">
            <div className="hero-topline" data-reveal>
              <span><i /> OPEN FOR OPPORTUNITIES</span>
              <span>PORTFOLIO · 2026</span>
            </div>
            <div className="hero-title" data-reveal>
              <p>{profile.role}</p>
              <h1>
                <span className="hero-title-line">
                  <em>AI</em> Runs. <em className="title-accent-taste">Taste</em> Wins.
                </span>
              </h1>
              <h2>{profile.heroTitleCn}</h2>
            </div>
            <div className="hero-bottom">
              <div className="hero-footer" data-reveal>
                <p>{profile.intro}</p>
                <div className="hero-actions">
                  <a className="button button-light" href="#work">
                    查看作品 <ArrowUpRight size={17} />
                  </a>
                  <button
                    className={copiedContact === "hero-wechat" ? "button button-ghost is-copied" : "button button-ghost"}
                    type="button"
                    aria-label="复制微信号 wangcl2012"
                    onClick={() => copyContact("hero-wechat", profile.contact.wechat)}
                  >
                    {copiedContact === "hero-wechat" ? (
                      <>
                        <Check size={16} />
                        已复制微信号
                      </>
                    ) : (
                      "发起合作"
                    )}
                  </button>
                </div>
                <a className="scroll-cue" href="#about" aria-label="向下浏览">
                  <ArrowDown size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section capability-showcase about-showcase" id="about">
          <Lightfall
            colors={heroLightfallColors}
            backgroundColor="#12005C"
            speed={0.28}
            streakCount={2}
            streakWidth={0.7}
            streakLength={1.15}
            glow={0.58}
            density={0.34}
            twinkle={0.35}
            zoom={3.2}
            backgroundGlow={0.34}
            opacity={0.42}
            mouseInteraction={false}
            dpr={1}
            maxFps={24}
            className="about-lightfall"
          />
          <div className="about-lightfall-shade" />
          <div className="page-shell">
            <SectionIntro index="01" label="ABOUT ME" title="关于我" />
            <div className="capability-hero">
              <div className="capability-intro">
                <p className="overline" data-reveal="left">MEDIA × CONTENT × AI</p>
                <h2 data-reveal="left" style={{ "--reveal-delay": "80ms" }}>
                  <span>让前沿模型，</span>
                  <span>成为创意生产力。</span>
                </h2>
                <p
                  className="about-philosophy"
                  data-reveal="left"
                  style={{ "--reveal-delay": "150ms" }}
                >
                  {profile.philosophy.lead}
                  <strong>{profile.philosophy.motto}</strong>
                  {profile.philosophy.tail}
                </p>
                <div
                  className="about-dashboard"
                  data-reveal="scale"
                  style={{ "--reveal-delay": "220ms" }}
                >
                  <div className="dashboard-status">
                    <span>CREATIVE OPERATING SYSTEM</span>
                    <span><i /> AI WORKFLOW ONLINE</span>
                  </div>
                  <div className="dashboard-metrics">
                    {profile.aboutDashboard.metrics.map((metric) => (
                      <article key={metric.label}>
                        <strong>{metric.value}</strong>
                        <h3>{metric.label}</h3>
                        <p>{metric.detail}</p>
                      </article>
                    ))}
                  </div>
                  <div className="dashboard-workflow">
                    <div className="dashboard-label">
                      <span>AI CONTENT PIPELINE</span>
                      <span>END TO END</span>
                    </div>
                    <ol>
                      {profile.aboutDashboard.workflow.map((item, index) => {
                        const WorkflowIcon = workflowIcons[index];
                        return (
                          <li key={item}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <WorkflowIcon aria-hidden="true" />
                            <strong>{item}</strong>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                  <div className="dashboard-tools">
                    <span>TOOL STACK</span>
                    <div>
                      {profile.aboutDashboard.tools.map((tool) => {
                        const ToolIcon = toolIcons[tool] || Sparkles;
                        return (
                          <i key={tool}>
                            <ToolIcon aria-hidden="true" />
                            {tool}
                          </i>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="capability-visual"
                data-reveal="right"
                style={{ "--reveal-delay": "120ms" }}
              >
                <img
                  src="/assets/profile-full.webp"
                  alt="王成龙侧身照片"
                  width="1086"
                  height="1448"
                  loading="lazy"
                  decoding="async"
                />
                <div className="model-watermarks" aria-label="主要使用模型">
                  {featuredModels.map((model, index) => (
                    <span
                      className={`model-watermark model-${model.id}`}
                      key={model.id}
                      title={model.name}
                      data-reveal="scale"
                      style={{ "--reveal-delay": `${300 + index * 90}ms` }}
                    >
                      <i className="model-symbol" aria-hidden="true" />
                    </span>
                  ))}
                </div>
                <p>WANG<br />CHENGLONG</p>
              </div>
            </div>
          </div>
        </section>

        <section className="capability-deck" id="capability-matrix" aria-labelledby="capability-deck-title">
          <div className="page-shell">
            <SectionIntro index="02" label="CORE CAPABILITIES" />
            <div className="capability-deck-heading" data-reveal>
              <div>
                <h2 id="capability-deck-title">能力矩阵</h2>
              </div>
              <p>点击卡片，点亮能力边界</p>
            </div>
            <div className="capability-card-grid">
              {capabilities.map((item, index) => {
                const Icon = capabilityIcons[index];
                const isActive = activeCapability === item.index;
                return (
                  <div
                    className="capability-reveal"
                    key={item.title}
                    data-reveal="scale"
                    style={{ "--reveal-delay": `${index * 85}ms` }}
                  >
                    <BorderGlow
                      className={`capability-glow tone-${(index % 3) + 1}${isActive ? " is-active" : ""}`}
                      glowColor={index % 3 === 0 ? "215 100 82" : index % 3 === 1 ? "256 100 72" : "301 100 80"}
                      animated
                      animationDelay={index * 110}
                    >
                      <button
                        className="capability-card"
                        type="button"
                        data-capability={item.index}
                        aria-pressed={isActive}
                        onClick={() => setActiveCapability(isActive ? null : item.index)}
                      >
                        <span className="capability-icon">
                          <Icon size={23} strokeWidth={1.35} />
                        </span>
                        <span className="capability-number">{item.index}</span>
                        <div className="capability-card-copy">
                          <h3>{item.title}</h3>
                          <p>{item.text}</p>
                        </div>
                      </button>
                    </BorderGlow>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section work" id="work">
          <div className="page-shell">
            <SectionIntro index="03" label="SELECTED WORK" />
            <div className="work-heading" data-reveal>
              <div className="section-heading">
                <p className="overline">SELECTED WORK</p>
                <h2>作品不止于生成。</h2>
              </div>
              <div className="filters" aria-label="作品筛选">
                {filters.map(([value, label]) => (
                  <button
                    type="button"
                    className={filter === value ? "is-active" : ""}
                    key={value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {filter === "image" ? (
              <div className="image-work-sections">
                {visibleImageSections.map((section, sectionIndex) => (
                  <section
                    className="image-work-section"
                    key={section.id}
                    aria-labelledby={`image-work-${section.id}`}
                    data-reveal
                    style={{ "--reveal-delay": `${sectionIndex * 120}ms` }}
                  >
                    <div className="image-work-header">
                      <div>
                        <p className="overline">{section.id === "prompt" ? "PROMPT TO VISUAL" : "DESIGN SYSTEM"}</p>
                        <h3 id={`image-work-${section.id}`}>{section.title}</h3>
                      </div>
                      <p>{section.summary}</p>
                    </div>
                    <div className="project-rail" aria-label={`${section.title}横向作品列表`}>
                      {section.projects.map((project, index) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          index={index}
                          onSelect={setSelectedProject}
                          rail
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : filter === "commercial" ? (
              <div className="image-work-sections commercial-work-sections">
                {visibleCommercialSections.map((section, sectionIndex) => (
                  <section
                    className="image-work-section commercial-work-section"
                    key={section.id}
                    aria-labelledby={`commercial-work-${section.id}`}
                    data-reveal
                    style={{ "--reveal-delay": `${sectionIndex * 120}ms` }}
                  >
                    <div className="image-work-header commercial-work-header">
                      <div>
                        <p className="overline">{section.eyebrow}</p>
                        <h3 id={`commercial-work-${section.id}`}>{section.title}</h3>
                      </div>
                      <p>{section.summary}</p>
                    </div>
                    <div className="commercial-feature-list">
                      {section.projects.map((project, index) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          index={index}
                          onSelect={setSelectedProject}
                          featured
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="project-grid">
                {visibleProjects.length > 0 ? (
                  visibleProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      onSelect={setSelectedProject}
                      featured={visibleProjects.length === 1 || project.featured}
                    />
                  ))
                ) : (
                  <div className="project-empty" data-reveal>
                    <span>COMING SOON</span>
                    <p>文案作品正在整理中</p>
                  </div>
                )}
              </div>
            )}
            {visibleProjects.some((project) => project.placeholder) && (
              <p className="content-note" data-reveal>当前图片为视觉占位素材，正式发布前请替换为你的真实作品。</p>
            )}
          </div>
        </section>

        <section className="section page-shell experience" id="experience">
          <SectionIntro index="04" label="WORK EXPERIENCE" />
          <div className="experience-heading" data-reveal>
            <div>
              <p className="overline">CAREER TIMELINE</p>
              <h2>工作经历 <span>/ work experience</span></h2>
            </div>
            <p>从媒体内容生产到品牌运营，再到 AI 驱动的创作与社群实践。</p>
          </div>
          <div className="timeline">
            {experience.map((item, index) => (
              <article
                key={`${item.company}-${item.period}`}
                data-reveal={index % 2 === 0 ? "left" : "right"}
                style={{ "--reveal-delay": `${Math.min(index * 55, 180)}ms` }}
              >
                <div className="timeline-meta">
                  <time>{item.period}</time>
                  <h3>{item.company}</h3>
                  <p>{item.role}</p>
                </div>
                <div className="timeline-axis" aria-hidden="true">
                  <span className="timeline-dot" />
                </div>
                <ol className="timeline-achievements">
                  {item.achievements.map((achievement) => (
                    <li key={achievement}>{achievement}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="page-shell contact-inner">
            <p className="overline" data-reveal>LET'S MAKE SOMETHING WORTH SEEING</p>
            <h2 data-reveal>下一个作品，<br /><span>从一次对话开始。</span></h2>
            <div className="contact-grid">
              <div data-reveal="scale">
                <p>EMAIL</p>
                <div className="contact-value">
                  <a href={profile.contact.email.includes("@") ? `mailto:${profile.contact.email}` : undefined}>
                    {profile.contact.email} <ArrowUpRight size={18} />
                  </a>
                  <button
                    className={copiedContact === "email" ? "copy-button is-copied" : "copy-button"}
                    type="button"
                    aria-label="复制邮箱"
                    onClick={() => copyContact("email", profile.contact.email)}
                  >
                    {copiedContact === "email" ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedContact === "email" ? "已复制" : "复制"}</span>
                  </button>
                </div>
              </div>
              <div data-reveal="scale" style={{ "--reveal-delay": "90ms" }}>
                <p>WECHAT</p>
                <div className="contact-value">
                  <span>{profile.contact.wechat}</span>
                  <button
                    className={copiedContact === "wechat" ? "copy-button is-copied" : "copy-button"}
                    type="button"
                    aria-label="复制微信号"
                    onClick={() => copyContact("wechat", profile.contact.wechat)}
                  >
                    {copiedContact === "wechat" ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedContact === "wechat" ? "已复制" : "复制"}</span>
                  </button>
                </div>
              </div>
              <div data-reveal="scale" style={{ "--reveal-delay": "180ms" }}>
                <p>PHONE</p>
                <div className="contact-value">
                  <span>{profile.contact.phone}</span>
                  <button
                    className={copiedContact === "phone" ? "copy-button is-copied" : "copy-button"}
                    type="button"
                    aria-label="复制手机号"
                    onClick={() => copyContact("phone", profile.contact.phone)}
                  >
                    {copiedContact === "phone" ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedContact === "phone" ? "已复制" : "复制"}</span>
                  </button>
                </div>
              </div>
            </div>
            <footer data-reveal>
              <span>© 2026 {profile.name}</span>
              <span>DESIGNED FOR AI × CREATIVITY</span>
            </footer>
          </div>
        </section>
      </main>

      {selectedProject && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedProject(null)}>
          <article
            className="project-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProject.title}项目详情`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelectedProject(null)}>
              <X />
              <span>关闭</span>
            </button>
            <div className={`modal-media${selectedProject.orientation === "portrait" ? " is-portrait" : ""}${selectedProject.article ? " is-article-cover" : ""}`}>
              {selectedProject.video ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  poster={selectedProject.image}
                  controlsList="nodownload"
                >
                  <source src={selectedProject.video} type="video/mp4" />
                  当前浏览器不支持视频播放。
                </video>
              ) : (
                <img
                  src={selectedProject.image}
                  alt=""
                  decoding="async"
                />
              )}
            </div>
            <div className={selectedProject.article ? "modal-content article-modal-content" : "modal-content"}>
              <p className="overline">{selectedProject.typeLabel} · {selectedProject.number}</p>
              <h2>{selectedProject.title}</h2>
              {selectedProject.article ? (
                <>
                  <div className="article-meta">
                    <span>{selectedProject.readTime}</span>
                    <span>{selectedProject.tools.join(" · ")}</span>
                  </div>
                  <ArticleBody markdown={articleSources[selectedProject.article]} />
                </>
              ) : (
                <>
                  <Detail label="项目背景" value={selectedProject.background} />
                  <Detail label="创作过程" value={selectedProject.process} />
                  <Detail label="最终成果" value={selectedProject.result} />
                  <Detail label="使用工具" value={selectedProject.tools.join(" / ")} />
                </>
              )}
            </div>
          </article>
        </div>
      )}
    </>
  );
}

function ProjectCard({ project, index, onSelect, featured = false, rail = false }) {
  return (
    <button
      className={`project-card${featured ? " featured" : ""}${project.orientation === "portrait" ? " portrait" : ""}${rail ? " rail-card" : ""}`}
      type="button"
      onClick={() => onSelect(project)}
      data-reveal="scale"
      style={{ "--reveal-delay": `${index * 80}ms` }}
    >
      <div className="project-media">
        <img
          src={project.image}
          alt=""
          width={project.orientation === "portrait" ? 720 : 1280}
          height={project.orientation === "portrait" ? 1280 : 720}
          loading="lazy"
          decoding="async"
        />
        <span className="project-number">{project.number}</span>
        {project.type === "video" && (
          <>
            <span className="play-icon"><Play size={19} fill="currentColor" /></span>
            <span className="video-duration">{project.duration}</span>
          </>
        )}
      </div>
      <div className="project-meta">
        <div>
          <p>{project.typeLabel}</p>
          <h3>{project.title}</h3>
          <span>{project.subtitle}</span>
        </div>
        <span className="project-meta-action" aria-hidden="true">
          <span>查看详情</span>
          <ArrowUpRight size={15} />
        </span>
      </div>
    </button>
  );
}

function SectionIntro({ index, label, title }) {
  return (
    <div className={title ? "section-intro has-title" : "section-intro"} data-reveal>
      <span className="section-index">{index}</span>
      <div className="section-intro-copy">
        {title && <strong>{title}</strong>}
        <p>{label}</p>
      </div>
      <i />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="modal-detail">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

function ArticleBody({ markdown }) {
  const blocks = useMemo(() => parseArticle(markdown), [markdown]);

  return (
    <article className="article-body">
      {blocks.map((block, index) => {
        if (block.type === "image") {
          return (
            <figure key={`${block.src}-${index}`}>
              <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
              <figcaption>{block.alt}</figcaption>
            </figure>
          );
        }
        if (block.type === "heading2") {
          return <h3 key={`${block.text}-${index}`}>{renderInlineText(block.text)}</h3>;
        }
        if (block.type === "heading3") {
          return <h4 key={`${block.text}-${index}`}>{renderInlineText(block.text)}</h4>;
        }
        if (block.type === "divider") {
          return <hr key={`divider-${index}`} />;
        }
        return <p key={`${block.text}-${index}`}>{renderInlineText(block.text)}</p>;
      })}
    </article>
  );
}

export default App;
