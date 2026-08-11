export type FirstAidTopic = {
  slug: string;
  title: string;
  summary: string;
  steps: string[];
  warning: string;
};

export const FIRST_AID: FirstAidTopic[] = [
  {
    slug: "fall",
    title: "After a fall",
    summary: "What to do when an elderly person falls.",
    steps: [
      "Stay calm and do not rush to lift the person.",
      "Ask if they feel pain in the head, neck, hip or back.",
      "If there is severe pain, deformity or head injury, call 123 and do not move them.",
      "If they feel able, help them roll to their side, then to hands and knees, then onto a sturdy chair.",
      "Watch for confusion, vomiting or drowsiness in the next 24 hours.",
    ],
    warning: "Never move someone with suspected spine or hip injury.",
  },
  {
    slug: "cpr",
    title: "CPR for adults",
    summary: "Chest compressions when someone is unresponsive and not breathing.",
    steps: [
      "Check response and breathing for no more than 10 seconds.",
      "Call 123 and get an AED if available.",
      "Place hands in the centre of the chest, arms straight.",
      "Push hard and fast: 100–120 compressions per minute, 5–6 cm deep.",
      "Continue until the ambulance arrives or the person moves.",
    ],
    warning: "Only trained rescuers should attempt rescue breaths.",
  },
  {
    slug: "choking",
    title: "Choking",
    summary: "Clearing a blocked airway.",
    steps: [
      "Ask 'Are you choking?' — if they can cough, encourage coughing.",
      "Give 5 firm back blows between the shoulder blades.",
      "Give 5 abdominal thrusts (Heimlich manoeuvre).",
      "Alternate 5 and 5 until the object clears.",
      "If they become unresponsive, start CPR and call 123.",
    ],
    warning: "Do not use abdominal thrusts on infants or pregnant women.",
  },
  {
    slug: "stroke",
    title: "Stroke (FAST)",
    summary: "Recognise a stroke in seconds.",
    steps: [
      "Face: ask them to smile — is one side drooping?",
      "Arms: can they raise both arms and keep them up?",
      "Speech: is speech slurred or strange?",
      "Time: call 123 immediately and note the time symptoms started.",
      "Do not give food, drink or medication.",
    ],
    warning: "Every minute counts — do not wait to see if symptoms pass.",
  },
  {
    slug: "heart-attack",
    title: "Heart attack",
    summary: "Chest pain, sweating, breathlessness.",
    steps: [
      "Call 123 immediately.",
      "Help the person sit down, knees bent, leaning back.",
      "Loosen tight clothing and keep them calm.",
      "If prescribed, help them take their own nitroglycerin.",
      "If unresponsive and not breathing, start CPR.",
    ],
    warning: "Do not let the person drive themselves to hospital.",
  },
  {
    slug: "seizure",
    title: "Seizure",
    summary: "Protecting someone during a convulsion.",
    steps: [
      "Clear hard objects away and cushion the head.",
      "Do not restrain them or put anything in their mouth.",
      "Time the seizure.",
      "When it stops, roll them onto their side.",
      "Call 123 if it lasts over 5 minutes or repeats.",
    ],
    warning: "Stay with the person until they are fully alert.",
  },
  {
    slug: "bleeding",
    title: "Severe bleeding",
    summary: "Controlling heavy blood loss.",
    steps: [
      "Apply firm direct pressure with a clean cloth.",
      "Do not remove soaked dressings — add more on top.",
      "Raise the injured limb above heart level if possible.",
      "Keep the person warm and lying down.",
      "Call 123 if bleeding does not stop.",
    ],
    warning: "Do not apply a tourniquet unless trained.",
  },
  {
    slug: "low-sugar",
    title: "Low blood sugar",
    summary: "Hypoglycaemia in diabetic patients.",
    steps: [
      "Look for shaking, sweating, confusion or slurred speech.",
      "Give 15 g fast sugar: juice, glucose tablets or 3 teaspoons of sugar.",
      "Wait 15 minutes and re-check.",
      "Repeat once if still unwell, then give a snack with carbohydrate.",
      "Call 123 if the person is unconscious — never give food by mouth.",
    ],
    warning: "Unconscious patients must not be given anything to swallow.",
  },
  {
    slug: "burns",
    title: "Burns",
    summary: "Cooling and covering a burn.",
    steps: [
      "Cool the burn under running water for 20 minutes.",
      "Remove rings and tight clothing near the burn.",
      "Cover loosely with cling film or a clean non-fluffy cloth.",
      "Do not apply toothpaste, butter or ice.",
      "Seek hospital care for burns larger than the palm of the hand.",
    ],
    warning: "Electrical and chemical burns always need medical review.",
  },
  {
    slug: "heat-stroke",
    title: "Heat stroke",
    summary: "Dangerous overheating, common in Egyptian summers.",
    steps: [
      "Move the person into shade or air conditioning.",
      "Remove excess clothing.",
      "Cool with wet cloths, a fan or a cool shower.",
      "Give sips of water if fully alert.",
      "Call 123 if confused, vomiting or unconscious.",
    ],
    warning: "Heat stroke can be fatal within an hour — act fast.",
  },
];
