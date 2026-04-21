const STOPWORDS = new Set([
  // English
  "i","me","my","myself","we","our","ours","ourselves","you","your","yours",
  "yourself","he","him","his","himself","she","her","hers","herself","it","its",
  "they","them","their","theirs","themselves","what","which","who","whom","this",
  "that","these","those","am","is","are","was","were","be","been","being","have",
  "has","had","having","do","does","did","doing","a","an","the","and","but","if",
  "or","because","as","until","while","of","at","by","for","with","about","into",
  "through","before","after","to","from","up","down","in","out","on","off","over",
  "under","then","here","there","when","where","why","how","all","both","each",
  "more","most","other","some","no","not","only","own","same","so","than","too",
  "very","just","will","would","should","could","can","may","might","also","like",
  "much","well","really","even","still","already","always","often","never","now",
  "since","during","always","around","every","quite","rather","though","yet","away",
  // German
  "ich","du","er","sie","es","wir","ihr","uns","euch","sich","mein","dein","sein",
  "unser","mich","dich","ihn","und","oder","aber","denn","wenn","weil","obwohl",
  "dass","die","der","das","den","dem","des","ein","eine","einer","einem","einen",
  "eines","ist","bin","bist","sind","seid","war","waren","hat","habe","haben",
  "hatte","hatten","wird","werden","wurde","wurden","auf","mit","zu","bei","nach",
  "von","aus","für","über","unter","neben","vor","durch","um","nicht","kein",
  "keine","noch","auch","schon","nur","sehr","viel","alle","alles","beim","zum",
  "zur","im","am","wie","was","wer","wo","wann","warum","welche","welcher","dieser",
  "diese","dieses","diesen","meine","meinen","meiner","meinem","man","mal","dann",
  "doch","wird","werden","kann","soll","muss","sind","haben","dabei","bereits",
  "immer","jetzt","schon","gerne","gern","eben","dazu","damit","nach","selbst",
]);

/**
 * Extract the top N keywords from a motivation letter.
 * Returns a comma-separated string suitable for the `extractedKeywords` field.
 */
export function extractKeywords(text: string, topN = 5): string {
  const tokens = text
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter((t) => t.length > 3 && !STOPWORDS.has(t) && /^[a-zäöüß]+$/i.test(t));

  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word)
    .join(", ");
}
