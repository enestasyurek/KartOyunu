// data/cards.js
export const cardData = {
  kırmızı: [
    "En son yalan söylediğin zamanı anlat.",
    { text: "10 saniye boyunca saçma bir dans yap.", votable: true }, // Oylanabilir
    "Şu an bir sırrın var mı?",
    "Telefonundan son çektiğin fotoğrafı göster.",
    "Hayatındaki en utanç verici anı anlat.",
    { text: "3 tur boyunca bir hayvan taklidi yaparak konuş.", votable: true }, // Oylanabilir
    "Bir gün boyunca kim olmak isterdin?",
    "Şu an bir süper gücün olsa hangisini isterdin?",
    "Arkadaş grubunda en komik kişi kim sence?",
    "Şu an aklından geçen ilk şeyi dürüstçe söyle.",
    "Şu anda en yakınındaki kişiye sarıl.",
    "Gizli hayran olduğun biri var mı?",
    "Hiç gizlice birinin eşyasını kullandın mı?",
    "Şu an bir dilek tutacak olsan ne dilerdin?",
    { text: "Hemen bir şarkı uydur ve 20 saniye boyunca söyle.", votable: true }, // Oylanabilir
    // Özel görevler buraya eklenecek (context'te)
  ],
  mavi: [
    "Sana hiç aşık olduğunu söyleyen biri oldu mu?",
    "Bir kişiye rastgele iltifat et.",
    "Arkadaş grubunda en güvenmediğin kişi kim?",
    "1 dakika boyunca gözlerin kapalı yürümeye çalış.",
    "En büyük korkun nedir?",
    "Bir arkadaşına aşk ilanı yapıyormuş gibi rol yap.",
    "Sana yapılan en kötü şakayı anlat.",
    "En komik ses tonunla rastgele bir cümle oku.",
    "Şu anda içini en çok sıkan şeyi söyle.",
    "Son aradığın kişiyi ara ve ona saçma bir soru sor."
    // Daha fazla mavi görev ekle...
  ],
  siyah: [
    "Hiç bir sırrı ifşa ettin mi? Neydi?",
    "Telefon rehberinden rastgele bir kişiyi ara ve ona şarkı söyle.",
    "Bir arkadaşına karşı kıskançlık hissettin mi? Anlat.",
    "Şu anda burada bulunan biri hakkında kötü bir düşüncen var mı? İtiraf et.",
    "Rastgele seçilen bir kelimeyle 1 dakikalık hikâye uydur ve anlat."
    // Daha fazla siyah görev ekle...
  ]
};

// Fisher-Yates (aka Knuth) Shuffle Algorithm
export const shuffleDeck = (deck) => {
  let shuffled = [...deck]; // Create a copy to avoid modifying the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
};