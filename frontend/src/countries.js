// src/countries.js
const countries = [
  {
    code: "MM",
    name: "Myanmar",
    phone: "+95", // Myanmar country code
    provinces: [
      {
        name: "Yangon Region",
        cities: ["Yangon", "Insein", "Hlegu"],
      },
      {
        name: "Mandalay Region",
        cities: ["Mandalay", "Pyin Oo Lwin", "Amarapura"],
      },
    ],
  },
  {
    code: "TH",
    name: "Thailand",
    phone: "+66", // Thailand country code
    provinces: [
      {
        name: "Bangkok", // Special administrative area
        cities: [
          "Phra Nakhon",
          "Dusit",
          "Nong Chok",
          "Bang Rak",
          "Bang Khen",
          "Bang Kapi",
          "Pathum Wan",
          "Pom Prap Sattru Phai",
          "Phra Khanong",
          "Min Buri",
          "Lat Krabang",
          "Yan Nawa",
          "Samphanthawong",
          "Phaya Thai",
          "Thon Buri",
          "Bangkok Yai",
          "Huai Khwang",
          "Khlong San",
          "Taling Chan",
          "Bangkok Noi",
          "Bang Khun Thian",
          "Phasi Charoen",
          "Nong Khaem",
          "Rat Burana",
          "Bang Phlat",
          "Din Daeng",
          "Bueng Kum",
          "Sathon",
          "Bang Sue",
          "Chatuchak",
          "Bang Kho Laem",
          "Prawet",
          "Khlong Toei",
          "Suan Luang",
          "Chom Thong",
          "Don Mueang",
          "Ratchathewi",
          "Lat Phrao",
          "Wang Thonglang",
          "Sai Mai",
          "Khan Na Yao",
          "Saphan Sung",
          "Wang Noi",
          "Thung Khru",
          "Bang Na",
          "Khlong Sam Wa",
          "Bang Bon",
          "Lak Si",
          "Thawi Watthana",
        ],
      },
      {
        name: "Amnat Charoen Province",
        cities: ["Amnat Charoen", "Chanuman", "Hua Taphan"],
      },
      {
        name: "Ang Thong Province",
        cities: ["Ang Thong", "Chaiyo", "Pa Mok"],
      },
      {
        name: "Ayutthaya Province",
        cities: ["Ayutthaya", "Bang Pa-in", "Sena"],
      },
      {
        name: "Bueng Kan Province",
        cities: ["Bueng Kan", "Sekai", "So Phisai"],
      },
      {
        name: "Buriram Province",
        cities: ["Buriram", "Nang Rong", "Prakhon Chai"],
      },
      {
        name: "Chachoengsao Province",
        cities: ["Chachoengsao", "Bang Pakong", "Phanom Sarakham"],
      },
      {
        name: "Chai Nat Province",
        cities: ["Chai Nat", "Hankha", "Manorom"],
      },
      {
        name: "Chaiyaphum Province",
        cities: ["Chaiyaphum", "Bamnet Narong", "Kaeng Khro"],
      },
      {
        name: "Chanthaburi Province",
        cities: ["Chanthaburi", "Khlung", "Laem Sing"],
      },
      {
        name: "Chiang Mai Province",
        cities: ["Chiang Mai", "San Sai", "Mae Rim", "Hang Dong", "Doi Saket"],
      },
      {
        name: "Chiang Rai Province",
        cities: ["Chiang Rai", "Mae Sai", "Chiang Khong", "Phan"],
      },
      {
        name: "Chonburi Province",
        cities: ["Chonburi", "Pattaya", "Sriracha", "Laem Chabang", "Bang Lamung"],
      },
      {
        name: "Chumphon Province",
        cities: ["Chumphon", "Lang Suan", "Tha Sae"],
      },
      {
        name: "Kalasin Province",
        cities: ["Kalasin", "Kuchinarai", "Kamalasai"],
      },
      {
        name: "Kamphaeng Phet Province",
        cities: ["Kamphaeng Phet", "Khanu Woralaksaburi", "Khlong Khlung"],
      },
      {
        name: "Kanchanaburi Province",
        cities: ["Kanchanaburi", "Tha Maka", "Sai Yok"],
      },
      {
        name: "Khon Kaen Province",
        cities: ["Khon Kaen", "Chum Phae", "Mancha Khiri"],
      },
      {
        name: "Krabi Province",
        cities: ["Krabi", "Ao Luek", "Khao Phanom", "Koh Lanta"],
      },
      {
        name: "Lampang Province",
        cities: ["Lampang", "Mueang Pan", "Hang Chat"],
      },
      {
        name: "Lamphun Province",
        cities: ["Lamphun", "Mae Tha", "Ban Hong"],
      },
      {
        name: "Loei Province",
        cities: ["Loei", "Wang Saphung", "Chiang Khan"],
      },
      {
        name: "Lopburi Province",
        cities: ["Lopburi", "Tha Wung", "Ban Mi"],
      },
      {
        name: "Mae Hong Son Province",
        cities: ["Mae Hong Son", "Pai", "Mae Sariang"],
      },
      {
        name: "Maha Sarakham Province",
        cities: ["Maha Sarakham", "Kosum Phisai", "Kanthatarawichai"],
      },
      {
        name: "Mukdahan Province",
        cities: ["Mukdahan", "Nikhom Kham Soi", "Don Tan"],
      },
      {
        name: "Nakhon Nayok Province",
        cities: ["Nakhon Nayok", "Ongkharak", "Ban Na"],
      },
      {
        name: "Nakhon Pathom Province",
        cities: ["Nakhon Pathom", "Sam Phran", "Nakhon Chai Si"],
      },
      {
        name: "Nakhon Phanom Province",
        cities: ["Nakhon Phanom", "That Phanom", "Renu Nakhon"],
      },
      {
        name: "Nakhon Ratchasima Province",
        cities: ["Nakhon Ratchasima", "Pak Chong", "Sung Noen", "Dan Khun Thot"],
      },
      {
        name: "Nakhon Sawan Province",
        cities: ["Nakhon Sawan", "Lat Yao", "Takhli"],
      },
      {
        name: "Nakhon Si Thammarat Province",
        cities: ["Nakhon Si Thammarat", "Thung Song", "Pak Phanang"],
      },
      {
        name: "Nan Province",
        cities: ["Nan", "Tha Wang Pha", "Pua"],
      },
      {
        name: "Narathiwat Province",
        cities: ["Narathiwat", "Sungai Kolok", "Tak Bai"],
      },
      {
        name: "Nong Bua Lamphu Province",
        cities: ["Nong Bua Lamphu", "Na Klang", "Si Bun Rueang"],
      },
      {
        name: "Nong Khai Province",
        cities: ["Nong Khai", "Tha Bo", "Sangkhom"],
      },
      {
        name: "Nonthaburi Province",
        cities: ["Nonthaburi", "Pak Kret", "Bang Bua Thong"],
      },
      {
        name: "Pathum Thani Province",
        cities: ["Pathum Thani", "Khlong Luang", "Lam Luk Ka"],
      },
      {
        name: "Pattani Province",
        cities: ["Pattani", "Yaring", "Sai Buri"],
      },
      {
        name: "Phang Nga Province",
        cities: ["Phang Nga", "Takua Pa", "Thai Mueang"],
      },
      {
        name: "Phatthalung Province",
        cities: ["Phatthalung", "Khao Chaison", "Tamot"],
      },
      {
        name: "Phayao Province",
        cities: ["Phayao", "Chiang Kham", "Dok Khamtai"],
      },
      {
        name: "Phetchabun Province",
        cities: ["Phetchabun", "Lom Sak", "Wichian Buri"],
      },
      {
        name: "Phetchaburi Province",
        cities: ["Phetchaburi", "Cha-am", "Khao Yoi"],
      },
      {
        name: "Phichit Province",
        cities: ["Phichit", "Bang Mun Nak", "Taphan Hin"],
      },
      {
        name: "Phitsanulok Province",
        cities: ["Phitsanulok", "Bang Rakam", "Nakhon Thai"],
      },
      {
        name: "Phrae Province",
        cities: ["Phrae", "Den Chai", "Rong Kwang"],
      },
      {
        name: "Phuket Province",
        cities: ["Phuket", "Patong", "Kathu", "Chalong", "Rawai"],
      },
      {
        name: "Prachinburi Province",
        cities: ["Prachinburi", "Kabin Buri", "Si Maha Phot"],
      },
      {
        name: "Prachuap Khiri Khan Province",
        cities: ["Prachuap Khiri Khan", "Hua Hin", "Pranburi"],
      },
      {
        name: "Ranong Province",
        cities: ["Ranong", "Kapoe", "La-un"],
      },
      {
        name: "Ratchaburi Province",
        cities: ["Ratchaburi", "Damnoen Saduak", "Ban Pong"],
      },
      {
        name: "Rayong Province",
        cities: ["Rayong", "Ban Chang", "Klaeng"],
      },
      {
        name: "Roi Et Province",
        cities: ["Roi Et", "Suwannaphum", "Kaset Wisai"],
      },
      {
        name: "Sa Kaeo Province",
        cities: ["Sa Kaeo", "Aranyaprathet", "Wang Nam Yen"],
      },
      {
        name: "Sakon Nakhon Province",
        cities: ["Sakon Nakhon", "Sawang Daen Din", "Kusuman"],
      },
      {
        name: "Samut Prakan Province",
        cities: ["Samut Prakan", "Bang Phli", "Phra Pradaeng"],
      },
      {
        name: "Samut Sakhon Province",
        cities: ["Samut Sakhon", "Krathum Baen", "Ban Phaeo"],
      },
      {
        name: "Samut Songkhram Province",
        cities: ["Samut Songkhram", "Amphawa", "Bang Khonthi"],
      },
      {
        name: "Saraburi Province",
        cities: ["Saraburi", "Kaeng Khoi", "Muak Lek"],
      },
      {
        name: "Satun Province",
        cities: ["Satun", "La-ngu", "Thung Wa"],
      },
      {
        name: "Sing Buri Province",
        cities: ["Sing Buri", "In Buri", "Phrom Buri"],
      },
      {
        name: "Sisaket Province",
        cities: ["Sisaket", "Khukhan", "Kantharalak"],
      },
      {
        name: "Songkhla Province",
        cities: ["Songkhla", "Hat Yai", "Sadao"],
      },
      {
        name: "Sukhothai Province",
        cities: ["Sukhothai", "Si Satchanalai", "Sawankhalok"],
      },
      {
        name: "Suphan Buri Province",
        cities: ["Suphan Buri", "Doem Bang Nang Buat", "Song Phi Nong"],
      },
      {
        name: "Surat Thani Province",
        cities: ["Surat Thani", "Koh Samui", "Koh Phangan", "Don Sak"],
      },
      {
        name: "Surin Province",
        cities: ["Surin", "Prasat", "Sangkha"],
      },
      {
        name: "Tak Province",
        cities: ["Tak", "Mae Sot", "Umphang"],
      },
      {
        name: "Trang Province",
        cities: ["Trang", "Kantang", "Sikao"],
      },
      {
        name: "Trat Province",
        cities: ["Trat", "Koh Chang", "Laem Ngop"],
      },
      {
        name: "Ubon Ratchathani Province",
        cities: ["Ubon Ratchathani", "Warin Chamrap", "Khueang Nai"],
      },
      {
        name: "Udon Thani Province",
        cities: ["Udon Thani", "Ban Dung", "Kumphawapi"],
      },
      {
        name: "Uthai Thani Province",
        cities: ["Uthai Thani", "Manorom", "Nong Chang"],
      },
      {
        name: "Uttaradit Province",
        cities: ["Uttaradit", "Tron", "Laplae"],
      },
      {
        name: "Yala Province",
        cities: ["Yala", "Betong", "Bannang Sata"],
      },
      {
        name: "Yasothon Province",
        cities: ["Yasothon", "Maha Chana Chai", "Kham Khuean Kaeo"],
      },
    ],
  },
];

export default countries;