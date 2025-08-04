export const instrumentGroups = [
  {
    id: 1,
    name: "سازهای الکترونیک",
    instruments: [
      { id: "keyboard", name: "کیبورد" },
      { id: "synthesizer", name: "سینث سایزر" },
      { id: "dj", name: "DJ" }
    ]
  },
  {
    id: 2,
    name: "سازهای بادی",
    instruments: [
      { id: "accordion", name: "آکاردیون" },
      { id: "melodica", name: "ملودیکا" },
      { id: "oboe", name: "ابوا" },
      { id: "bassoon", name: "باسون (فاگوت)" },
      { id: "trumpet", name: "ترومپت" },
      { id: "trombone", name: "ترومبون" },
      { id: "tuba", name: "توبا" },
      { id: "saxophone", name: "ساکسوفون" },
      { id: "clarinet", name: "کلارینت" },
      { id: "flute", name: "فلوت" },
      { id: "pan_flute", name: "پن فلوت" },
      { id: "piccolo", name: "پیکولو" },
      { id: "ukulele", name: "اوکوله له" },
      { id: "duduk", name: "دودوک" },
      { id: "balaban", name: "بالابان" },
      { id: "didgeridoo", name: "دیجریدو" },
      { id: "harmonica", name: "هارمونیکا" },
      { id: "horn", name: "هورن" },
      { id: "ney", name: "نی" },
      { id: "bagpipe", name: "نی انبان" },
      { id: "dozaleh", name: "دوزله" },
      { id: "tuytuk", name: "تویتوک (نی ترکمنی)" },
      { id: "sorna", name: "سرنا" },
      { id: "shemshal", name: "شمشال" },
      { id: "gharaney", name: "قره نی" },
      { id: "ghoshmeh", name: "قشمه" },
      { id: "karnay", name: "کرنای" },
      { id: "laleva", name: "لَله وا" }
    ]
  },
  {
    id: 3,
    name: "سازهای زهی",
    subgroups: [
      {
        id: "3_1",
        name: "غربی",
        instruments: [
          { id: "harp", name: "چنگ" },
          { id: "piano", name: "پیانو" },
          { id: "classical_guitar", name: "گیتار کلاسیک" },
          { id: "flamenco_guitar", name: "گیتار فلامنکو" },
          { id: "acoustic_guitar", name: "گیتار آکوستیک" },
          { id: "electric_guitar", name: "گیتار الکتریک" },
          { id: "bass_guitar", name: "گیتار بیس" },
          { id: "banjo", name: "بانجو" },
          { id: "mandolin", name: "ماندولین" },
          { id: "balalaika", name: "بالالایکا" },
          { id: "violin", name: "ویولن" },
          { id: "viola", name: "ویولا" },
          { id: "cello", name: "ویولن سل" },
          { id: "double_bass", name: "کنتر باس" }
        ]
      },
      {
        id: "3_2",
        name: "شرقی",
        instruments: [
          { id: "divan", name: "دیوان" },
          { id: "rebab", name: "رباب" },
          { id: "sitar", name: "سیتار" },
          { id: "benju", name: "بینجو" },
          { id: "ghichak", name: "قیچک" },
          { id: "oud", name: "بربط (عود)" }
        ]
      },
      {
        id: "3_3",
        name: "ایرانی",
        instruments: [
          { id: "tar", name: "تار" },
          { id: "setar", name: "سه تار" },
          { id: "dotar", name: "دوتار" },
          { id: "santoor", name: "سنتور" },
          { id: "kamancheh", name: "کمانچه" },
          { id: "tanbur", name: "تنبور" },
          { id: "qanun", name: "قانون" }
        ]
      }
    ]
  },
  {
    id: 4,
    name: "سازهای کوبه‌ای",
    instruments: [
      { id: "drums", name: "درامز" },
      { id: "percussion", name: "پرکاشن" },
      { id: "timpani", name: "تیمپانی" },
      { id: "darbuka", name: "داربوکا" },
      { id: "cajon", name: "کاخن" },
      { id: "hang_drum", name: "هنگ درام" },
      { id: "tonbak", name: "تنبک" },
      { id: "daf", name: "دف" },
      { id: "dayereh", name: "دایره" },
      { id: "dayereh_zangi", name: "دایره زنگی" }
    ]
  },
  {
    id: 5,
    name: "خواننده",
    instruments: [
      { id: "singer", name: "خواننده" },
      { id: "singer_bass", name: "خواننده (باس)" },
      { id: "singer_baritone", name: "خواننده (باریتون)" },
      { id: "singer_alto", name: "خواننده (آلتو)" },
      { id: "singer_tenor", name: "خواننده (تنور)" },
      { id: "singer_soprano", name: "خواننده (سوپرانو)" },
      { id: "back_vocal", name: "بک وکال" }
    ]
  }
];

export default instrumentGroups;


