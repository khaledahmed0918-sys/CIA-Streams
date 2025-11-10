export interface QuranicVerse {
  verse: string;
  // FIX: Made source, interpretation, and translation optional to be compatible with CustomVerse type.
  source?: string;
  interpretation?: string;
  translation?: string; // For reference
}

export const quranicVerses: QuranicVerse[] = [
  {
    verse: '﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾',
    source: '📖 سورة الشرح – الآية 6',
    interpretation: '💬 التفسير: وعد من الله أن كل شدة يتبعها رخاء، وكل ضيق وراءه فرج. ما من عسر إلا ومعه يسر مضاعف، لأن الله كررها للتأكيد على أن الفرج مضمون.',
    translation: 'God promises that after every hardship comes ease. Every difficulty is followed by relief, and God repeats this to emphasize that relief is guaranteed.'
  },
  {
    verse: '﴿ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسعَهَا ﴾',
    source: '📖 سورة البقرة – الآية 286',
    interpretation: '💬 التفسير: الله سبحانه لا يحمّل عباده ما لا يستطيعون تحمّله. كل ابتلاء أو تعب هو في حدود قدرتك، فلا تخف، لأن الله يعرف طاقتك أكثر مما تعرفها أنت.',
    translation: 'God does not burden anyone beyond their capacity. Every trial or difficulty is within your limits, so do not fear, for God knows your strength better than you do.'
  },
  {
    verse: '﴿ وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ﴾',
    source: '📖 سورة الطلاق – الآيتان 2-3',
    interpretation: '💬 التفسير: التقوى طريق الفرج. اللي يخاف الله ويبتعد عن الحرام، الله يسخّر له حلول من أماكن ما تخطر على باله، ويرزقه من حيث لا يتوقع.',
    translation: 'Piety is the path to relief. Whoever fears God and avoids wrongdoing, God will provide solutions from unexpected places and grant sustenance from sources they cannot imagine.'
  },
  {
    verse: '﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾',
    source: '📖 سورة البقرة – الآية 152',
    interpretation: '💬 التفسير: إذا ذكرت الله بلسانك، ذكرك هو في الملأ الأعلى. كل ذكر وشكر منك يفتح بابًا من البركة في حياتك.',
    translation: 'If you remember God with your tongue, He remembers you in the highest assembly. Every remembrance and gratitude opens a door of blessings in your life.'
  },
  {
    verse: '﴿ إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ ﴾',
    source: '📖 سورة الرعد – الآية 11',
    interpretation: '💬 التفسير: التغيير الحقيقي يبدأ من الداخل. الله ما يبدّل حال إنسان إلا لما يبدأ هو بتبديل نفسه وسلوكه ونيّته.',
    translation: 'True change begins within. God does not alter the condition of a people until they change what is within themselves.'
  },
  {
    verse: '﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾',
    source: '📖 سورة طه – الآية 114',
    interpretation: '💬 التفسير: هذا الدعاء أمر به الله نبيَّه ﷺ. المعنى واسع، فكل علم ينفعك في دينك أو دنياك هو زيادة من الله، فاطلبها دائمًا.',
    translation: 'This is a supplication commanded by God to His Prophet ﷺ. Any knowledge that benefits you in religion or worldly matters is an increase from God, so always seek it.'
  },
  {
    verse: '﴿ إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا ﴾',
    source: '📖 سورة النساء – الآية 1',
    interpretation: '💬 التفسير: الله يراك في كل وقت، يعلم نيتك وحركتك وسكونك. رقابة الله مش للخوف فقط، بل طمأنينة إنك أبدًا مو وحدك.',
    translation: 'God watches over you at all times, knowing your intentions, actions, and stillness. His oversight is not only for fear but also reassurance that you are never alone.'
  },
  {
    verse: '﴿ الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾',
    source: '📖 سورة الرعد – الآية 28',
    interpretation: '💬 التفسير: راحة البال الحقيقية تنولد من ذكر الله. كل همّ، كل قلق، يذوب لما تذكر ربك، لأن الذكر يعيدك للاتزان النفسي.',
    translation: 'True peace of heart comes from remembering God. Every worry or anxiety dissolves when you remember Him, as remembrance restores inner balance.'
  },
  {
    verse: '﴿ فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ ۝ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ ﴾',
    source: '📖 سورة الزلزلة – الآيتان 7-8',
    interpretation: '💬 التفسير: كل عمل مهما صغر أو كبر له وزن عند الله. حتى الابتسامة الصادقة محسوبة، وحتى الأذى البسيط له حساب، فانتبه لما يخرج منك.',
    translation: 'Every action, no matter how small or large, has weight with God. Even a sincere smile is counted, and every minor wrongdoing is accounted for, so be mindful of your deeds.'
  },
  {
    verse: '﴿ رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ ﴾',
    source: '📖 سورة آل عمران – الآية 8',
    interpretation: '💬 التفسير: دعاء الثبات على الإيمان. تسأل الله يثبّت قلبك بعد الهداية لأن القلب يتقلب، والرحمة هنا تشمل الحماية، والسكينة، والهداية المستمرة.',
    translation: 'A supplication for steadfastness in faith. You ask God to keep your heart firm after guidance, as hearts can waver. Mercy here includes protection, tranquility, and continuous guidance.'
  }
];