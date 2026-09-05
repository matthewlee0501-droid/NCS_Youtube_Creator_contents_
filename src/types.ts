export interface TitleOption {
  id: number;
  title: string;
  subTitle?: string;
  mainKeyword: string;
  subKeywords: string[];
  targetAudience: string;
  angle: string;
}

export interface BlogPostSection {
  subheading: string;
  content: string;
}

export interface BlogPostData {
  title: string;
  mainKeyword: string;
  subKeywords: string[];
  intro: string;
  sections: BlogPostSection[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  conclusion: string;
  callToAction: string;
  hashtags: string; // Single line with 15 hashtags e.g. "#키워드1 #키워드2 ..."
  wordCount: number;
  keywordCount: number;
}

export interface ImagePromptItem {
  id: number;
  sectionName: string;
  sceneDescriptionKo: string; // 장면 한글 상세 묘사
  midjourneyPromptEn: string;  // 영어 미드저니/실사 프롬프트
  recommendedAspect: string;  // e.g. "16:9" or "3:4"
  cameraStyle: string;         // e.g. "Canon EOS R5, 50mm f/1.4, natural daylight"
}

export interface YoutubeScriptScene {
  sceneNumber: number;
  timestamp: string;
  narrationScript: string;
  visualBrollDescription: string; // 스크립트에 어울리는 장면 글 묘사
  toneInstruction: string;
}

export interface YoutubePackageData {
  videoTitle: string;
  descriptionText: string;
  scriptScenes: YoutubeScriptScene[];
  tags: string[];
}

export interface GeneratedContentResponse {
  selectedTitle: string;
  blogPost?: BlogPostData | null;
  imagePrompts?: ImagePromptItem[] | null;
  youtubePackage?: YoutubePackageData | null;
}

export interface ProjectHistoryItem {
  id: string;
  createdAt: string;
  topic: string;
  selectedTitle: string;
  content: GeneratedContentResponse;
}
