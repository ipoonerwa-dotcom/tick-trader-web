// Labels shared by the store pages. Narratives and categories are stored in Chinese (the engine's own names).
export const NARRATIVES = ["币安系", "币股", "韩国梗", "名人热点", "动物卡通", "项目平台", "中文梗", "其他"] as const;

export const NARRATIVE_EN: Record<string, string> = {
  币安系: "Binance",
  币股: "Stock token",
  韩国梗: "Korean meme",
  名人热点: "Celebs & news",
  动物卡通: "Animals",
  项目平台: "Project",
  中文梗: "Chinese meme",
  其他: "Other",
};

export const CATEGORIES = ["交易", "链上工具", "内容创作", "开发", "其他"] as const;

export const CATEGORY_EN: Record<string, string> = {
  交易: "Trading",
  链上工具: "On-chain tools",
  内容创作: "Content",
  开发: "Development",
  其他: "Other",
};

export const STATUS: Record<string, [string, string]> = {
  pending: ["待审核", "In review"],
  approved: ["已上架", "Listed"],
  rejected: ["已驳回", "Rejected"],
  unlisted: ["已下架", "Unlisted"],
};
