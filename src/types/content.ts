export type ThesisKey =
  | "cambio-adentro"
  | "segui-tu-entusiasmo"
  | "acepto-lo-que-es"
  | "cultura-inconsciente";

export type SlideType = "cover" | "body" | "question" | "closing";

export type CarouselSlide = {
  number: number;
  type: SlideType;
  text: string;
};

export type CarouselContent = {
  title: string;
  caption: string;
  slides: CarouselSlide[];
  cta: string;
};

export type Thesis = {
  title: string;
  subtitle: string;
  symbols: string[];
  content_focus: string[];
  phrases: string[];
};
