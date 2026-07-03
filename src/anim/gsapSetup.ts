import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin, CustomEase, Flip);

// «Печать»: резкий вход с коротким пере-нажимом, как штамп по бумаге
CustomEase.create("stamp", "M0,0 C0.2,0 0.25,1.06 0.45,1.06 0.65,1.06 0.7,1 1,1");
// «Каретка»: быстрый старт, мягкий доезд — движение каретки печатной машинки
CustomEase.create("carriage", "M0,0 C0.1,0.6 0.25,1 1,1");

// Кириллический набор для scramble-эффектов
export const CYRILLIC_CHARS = "абвгдежзиклмнопрстуфхцчшщыэюя—…*";

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };
