const defaultQuestions = [
  {
    category: "معلومات عامة",
    questions: [
      { points: 100, type: "text", question: "ما هي عاصمة المملكة العربية السعودية؟", answer: "الرياض" },
      { points: 200, type: "multiple-choice", question: "أي كوكب هو الأكبر في المجموعة الشمسية؟", options: ["الأرض","المريخ","المشتري","زحل"], answer: "المشتري" },
      { points: 300, type: "true-false", question: "القارة الإفريقية أكبر مساحة من قارة آسيا.", options: ["صح","خطأ"], answer: "خطأ" },
      { points: 400, type: "text", question: "ما العنصر الكيميائي الذي رمزه O؟", answer: "الأكسجين" },
      { points: 500, type: "text", question: "ما أكبر محيط في العالم؟", answer: "المحيط الهادئ" }
    ]
  },
  {
    category: "إسلاميات",
    questions: [
      { points: 100, type: "text", question: "كم عدد أركان الإسلام؟", answer: "خمسة" },
      { points: 200, type: "multiple-choice", question: "ما أول سورة في المصحف؟", options: ["البقرة","الفاتحة","الناس","الإخلاص"], answer: "الفاتحة" },
      { points: 300, type: "text", question: "ما الشهر الذي يصوم فيه المسلمون؟", answer: "رمضان" },
      { points: 400, type: "true-false", question: "عدد الصلوات المفروضة خمس صلوات.", options: ["صح","خطأ"], answer: "صح" },
      { points: 500, type: "text", question: "من النبي الذي شارك ابنه إسماعيل في رفع قواعد الكعبة؟", answer: "إبراهيم عليه السلام" }
    ]
  },
  {
    category: "جغرافيا",
    questions: [
      { points: 100, type: "text", question: "في أي قارة تقع السعودية؟", answer: "آسيا" },
      { points: 200, type: "multiple-choice", question: "ما عاصمة فرنسا؟", options: ["روما","باريس","مدريد","برلين"], answer: "باريس" },
      { points: 300, type: "text", question: "ما عاصمة اليابان؟", answer: "طوكيو" },
      { points: 400, type: "text", question: "ما أكبر دولة في العالم من حيث المساحة؟", answer: "روسيا" },
      { points: 500, type: "text", question: "ما المضيق الذي يفصل آسيا عن أمريكا الشمالية؟", answer: "مضيق بيرينغ" }
    ]
  },
  {
    category: "تاريخ",
    questions: [
      { points: 100, type: "text", question: "في أي عام تم توحيد المملكة العربية السعودية؟", answer: "1932م" },
      { points: 200, type: "text", question: "من أول الخلفاء الراشدين؟", answer: "أبو بكر الصديق رضي الله عنه" },
      { points: 300, type: "multiple-choice", question: "ما الحضارة التي بنت أهرامات الجيزة؟", options: ["الرومانية","المصرية القديمة","اليونانية","الفارسية"], answer: "الحضارة المصرية القديمة" },
      { points: 400, type: "text", question: "ما عاصمة الدولة العباسية؟", answer: "بغداد" },
      { points: 500, type: "text", question: "من القائد الذي فتح القسطنطينية عام 1453م؟", answer: "السلطان محمد الفاتح" }
    ]
  },
  {
    category: "رياضة",
    questions: [
      { points: 100, type: "text", question: "كم لاعبًا يوجد في فريق كرة القدم داخل الملعب؟", answer: "11 لاعبًا" },
      { points: 200, type: "true-false", question: "مباراة كرة القدم تتكون من شوطين.", options: ["صح","خطأ"], answer: "صح" },
      { points: 300, type: "text", question: "كم نقطة تحتسب للرميّة الثلاثية في كرة السلة؟", answer: "3 نقاط" },
      { points: 400, type: "multiple-choice", question: "أي رياضة تستخدم مضربًا وكرة صفراء؟", options: ["التنس","السباحة","الجولف","كرة اليد"], answer: "التنس" },
      { points: 500, type: "text", question: "كم يبلغ طول سباق الماراثون تقريبًا؟", answer: "42.195 كيلومتر" }
    ]
  },
  {
    category: "ألغاز",
    questions: [
      { points: 100, type: "text", question: "ما الشيء الذي له أسنان ولا يعض؟", answer: "المشط" },
      { points: 200, type: "text", question: "ما الشيء الذي كلما أخذت منه كبر؟", answer: "الحفرة" },
      { points: 300, type: "text", question: "ما الشيء الذي يكتب ولا يقرأ؟", answer: "القلم" },
      { points: 400, type: "text", question: "له عين واحدة ولا يرى، ما هو؟", answer: "الإبرة" },
      { points: 500, type: "text", question: "ما الشيء الذي إذا نطقت باسمه كسرته؟", answer: "الصمت" }
    ]
  }
];
