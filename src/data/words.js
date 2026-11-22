/* ---------- données : les mots (kana|sens), découpés en kana et transcrits en romaji ---------- */
import { ITEMS } from './kana.js';
import { toks, romaji } from '../core/romaji.js';
const WORDS =
  `あい|amour;あお|bleu;あか|rouge;あさ|matin;いえ|maison;いぬ|chien;うえ|dessus;うみ|mer;えき|gare;おかね|argent;かお|visage;かさ|parapluie;かわ|rivière;き|arbre;くち|bouche;くも|nuage;くるま|voiture;こえ|voix;ここ|ici;さかな|poisson;さくら|cerisier;しお|sel;すし|sushi;せかい|monde;そら|ciel;たこ|poulpe;たまご|œuf;ちず|carte, plan;つき|lune;て|main;とり|oiseau;なつ|été;なまえ|nom;にく|viande;ぬの|tissu;ねこ|chat;のり|algue nori;はな|fleur;はし|baguettes;ひと|personne;ふね|bateau;ふゆ|hiver;へや|chambre;ほし|étoile;まち|ville;みみ|oreille;むし|insecte;め|œil;もり|forêt;やま|montagne;ゆき|neige;よる|nuit;りんご|pomme;るす|absence;れきし|histoire;ろく|six;わたし|moi, je;ほんをよむ|lire un livre;にほん|Japon;みせ|magasin;かがみ|miroir;ぎんこう|banque;かぐ|meubles;げんき|en forme;ごはん|riz, repas;ひざ|genou;かじ|incendie;みず|eau;かぜ|vent;かぞく|famille;だいがく|université;はなぢ|saignement de nez;つづく|continuer;でんわ|téléphone;まど|fenêtre;ばら|rose;くび|cou;ぶた|cochon;かべ|mur;ぼうし|chapeau;かんぱい|santé !;えんぴつ|crayon;てんぷら|tempura;さんぽ|promenade;きゃく|client, invité;きゅう|neuf;きょう|aujourd’hui;しゃしん|photo;しゅくだい|devoirs;しょうゆ|sauce soja;おちゃ|thé;ちゅうい|attention;ちょうちょ|papillon;こんにゃく|konjac;ぎゅうにゅう|lait;ひゃく|cent;みゃく|pouls;みょうじ|nom de famille;りゅう|dragon;りょこう|voyage;ぎゃく|inverse;ぎょうざ|gyoza;じゃま|gêne;じゅぎょう|cours;じょうず|doué;さんびゃく|trois cents;びょういん|hôpital;ぴょんぴょん|en sautillant;アイス|glace;カメラ|appareil photo;ケーキ|gâteau;コーヒー|café;ホテル|hôtel;タクシー|taxi;テレビ|télé;パン|pain;ピアノ|piano;メニュー|menu;ラーメン|ramen;レストラン|restaurant;トイレ|toilettes;バス|bus;ビール|bière;スキー|ski;ノート|cahier;ワイン|vin;ミルク|lait;ネクタイ|cravate;シャツ|chemise;ジュース|jus;チーズ|fromage;ゲーム|jeu vidéo;ペン|stylo;ドア|porte;ギター|guitare;ニュース|actualités;チョコレート|chocolat;シュークリーム|chou à la crème;メロン|melon;ゼロ|zéro;ズボン|pantalon;ボタン|bouton;ヨーグルト|yaourt;ナイフ|couteau;ハンバーガー|hamburger;フランス|France;パリ|Paris;エレベーター|ascenseur;オレンジ|orange;サラダ|salade;セーター|pull;デザート|dessert;ガイド|guide;ダンス|danse;ゴルフ|golf;プール|piscine;ピザ|pizza;ポスト|boîte aux lettres;キャベツ|chou;ジャム|confiture;ジョギング|jogging;ソース|sauce;ユーロ|euro;ムース|mousse;ホーム|quai de gare;ヒーター|radiateur;ロンドン|Londres;キウイ|kiwi;ルール|règle;モデル|mannequin;ハム|jambon;エアコン|climatisation;ベンチ|banc;ボール|ballon;ミュージアム|musée`
    .split(';')
    .map(x => {
      const [j, f] = x.split('|');
      return { j, f };
    });
for (const w of WORDS) {
  w.t = toks(w.j);
  w.r = romaji(w.j);
  w.s = ITEMS[w.t[0]].s;
}

export { WORDS };
