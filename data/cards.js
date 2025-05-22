export const cardData = {
  // Kırmızı Kartlar (Görevler)
  kırmızı: [
    // Genel & Komik
    "Şu an en çok yemek istediğin şeyi söyle ve nedenini açıkla.",
    "Bulunduğun odadaki bir nesneye komik bir isim ver ve 3 tur boyunca o isimle hitap et.",
    "Telefonundaki en utanç verici şarkıyı açıp 15 saniye dinlet.",
    "Bir sonraki turuna kadar sadece fısıldayarak konuş.",
    "Hayatında aldığın en kötü hediye neydi?",
    "En son kime yalan söylediğini itiraf et (detay gerekmez).",
    "Gruptaki bir kişiyi seç ve onun komik bir taklidini yap.", // Oylanabilir olabilir
    //{ text: "Yaptığın en garip alışkanlığını anlat.", votable: false },
    //{ text: "10 saniye boyunca durmadan kahkaha at.", votable: true }, // Oylanabilir
    //{ text: "3 tur boyunca konuştuğun her cümlenin sonuna '...dedi Optimus Prime' ekle.", votable: true }, // Oylanabilir
    //{ text: "Son google aramanı yüksek sesle oku.", votable: false },
    //{ text: "Gizli bir yeteneğin varsa göster veya anlat.", votable: false },

    
    // Biraz Daha Cesaret/Dürüstlük
    "Bu gruptaki bir kişiye dürüst bir iltifatta bulun.",
    "En büyük pişmanlığın nedir?",
    "Eğer görünmez olsan ilk yapacağın şey ne olurdu?",
    "Hiçbir sonuç doğurmayacak olsa, kime ne söylemek isterdin?",
    "Hayallerindeki iş nedir ve neden?",
    "Affetmekte en çok zorlandığın şey nedir?",
     // Özel görevler context'te eklenecek ('ÖZEL:' prefix'i ile)
  ],

  // Mavi Kartlar (Gizli Görevler - Devredildiğinde Yapılır)
  mavi: [
    "Bir dakika boyunca hiç konuşmadan sadece mimiklerle kendini ifade et.",
    "En sevdiğin ünlü gibi davranarak bir sonraki oyuncuya sıra ver.",
    "Şu anki ruh halini anlatan bir şarkı mırıldan.",
    "Gruptan birine sarıl ve 'İyi ki varsın!' de.",
    "Çocukken en sevdiğin çizgi filmi ve karakterini söyle.",
    "Komik bir surat ifadesi yap ve herkes fotoğrafını çekene kadar bekle.",
    "Sıradaki oyuncunun soracağı bir soruya 'Evet' demek zorundasın (Uygunsuzsa pas geçilebilir).",
    "Hayat mottonu söyle.",
    "En son gördüğün rüyayı anlat (hatırlıyorsan).",
    "Eğer bir hayvan olsan ne olurdun ve neden?",
    "Gruptaki bir kişiye rastgele bir lakap tak.",
    "Telefonundaki duvar kağıdını göster ve neden seçtiğini anlat."
    // Daha fazla eklenebilir
  ],

  // Siyah Kartlar (Oyun Sonu Cezaları)
  siyah: [
    "Oyundaki tüm oyuncuların komik bir özelliğini taklit et.",
    "Bir sonraki oyuna kadar telefonunu sadece acil durumlar için kullanabilirsin.",
    "Herkesin önünde 30 saniye boyunca en sevdiğin şarkıyla dans et.",
    "Sosyal medyada komik (ama uygun) bir paylaşım yap (herkesin onayıyla).",
    "Kaybeden olarak kazanan oyuncuya küçük bir iyilik yap (örn: içecek getirmek).",
    "Bir tekerlemeyi hızlıca 3 kez hatasız söylemeye çalış.",
    "Gruptaki herkes için kısa ve komik bir şiir uydur.",
    "Bir sonraki oyunun ilk 3 turunda her kararından önce zar atıyormuş gibi yap."
    // Daha fazla eklenebilir
  ]
};

// Fisher-Yates (Knuth) Karıştırma Algoritması - Değişiklik Yok
export const shuffleDeck = (deck) => {
  if (!Array.isArray(deck)) return []; // Güvenlik kontrolü
  let shuffled = [...deck]; // Orijinal desteyi bozmamak için kopyala
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 0 ile i arasında rastgele index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Elemanları yer değiştir
  }
  return shuffled;
};