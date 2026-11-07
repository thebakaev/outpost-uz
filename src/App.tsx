import AdminAuth from './AdminAuth'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import {
  Search, ChevronDown, Crosshair, Hammer, Recycle, Shield, Boxes, BookOpen,
  Menu, ArrowUpRight, Zap, Flame, Pickaxe, HeartPulse, Shirt, Package,
  X, MapPin, Plus, Minus, Trash2, Calculator, Compass, Building2, Home,
  Info, ExternalLink
} from 'lucide-react'

type Tab = 'wiki' | 'raid' | 'monuments' | 'recycler' | 'craft'
type PublicSiteSettings = {
  site_name: string
  site_description: string
  site_logo_url: string
  contact_email: string
  seo_title: string
  seo_description: string
}
const defaultSiteSettings: PublicSiteSettings = {
  site_name: 'OUTPOST UZ',
  site_description: 'Rust olamidagi buyumlar, qurilish, monumentlar va strategiyalar — bir joyda, o‘zbek tilida.',
  site_logo_url: '',
  contact_email: '',
  seo_title: 'OUTPOST UZ — Rust Wiki o‘zbek tilida',
  seo_description: 'Rust o‘yini bo‘yicha o‘zbek tilidagi Wiki, Raid Calculator, Craft va Recycler.'
}
type WikiSection = 'items' | 'weapons' | 'blueprints'
type WikiDetail = { kind: 'item' | 'weapon' | 'blueprint'; name: string } | null
type RaidMethod = 'c4' | 'rocket' | 'satchel' | 'ammo' | 'beancan'
type Target = {
  id: string; name: string; group: string; hp: number
  c4: number; rocket: number; satchel: number; ammo: number; beancan: number
}
type RaidLine = { id: number; targetId: string; quantity: number }

const categories = [
  { name: 'Barchasi', icon: Boxes },
  { name: 'Qurollar', icon: Crosshair },
  { name: 'Qurilish', icon: Hammer },
  { name: 'Resurslar', icon: Pickaxe },
  { name: 'Kiyimlar', icon: Shirt },
  { name: 'Tibbiyot', icon: HeartPulse },
  { name: 'O‘q-dorilar', icon: Flame },
  { name: 'Komponentlar', icon: Package },
  { name: 'Asboblar', icon: Pickaxe },
  { name: 'Elektrika', icon: Zap },
  { name: 'Tuzoqlar', icon: Shield },
  { name: 'Oziq-ovqat', icon: HeartPulse },
]
const items = [
  { name: 'AK-47 (Assault Rifle)', category: 'Qurollar', description: 'Avtomatik hujum miltig‘i', icon: '🔫', note: 'Qurol' },
  { name: 'Metal Fragments', category: 'Resurslar', description: 'Metall buyumlar tayyorlash uchun', icon: '🪙', note: 'Resurs' },
  { name: 'Timed Explosive Charge', category: 'Qurollar', description: 'Buzish uchun portlovchi zaryad', icon: '💣', note: 'Portlovchi' },
  { name: 'Large Medkit', category: 'Tibbiyot', description: 'Sog‘liqni tiklash vositasi', icon: '🧰', note: 'Tibbiyot' },
  { name: 'Armored Door', category: 'Qurilish', description: 'Mustahkam zirhli eshik', icon: '🚪', note: 'Qurilish' },
  { name: 'Tech Trash', category: 'Komponentlar', description: 'Elektronika komponenti', icon: '🔩', note: 'Komponent' },
  { name: 'Road Sign Jacket', category: 'Kiyimlar', description: 'Himoya kiyimi', icon: '🦺', note: 'Kiyim' },
  { name: '5.56 Rifle Ammo', category: 'O‘q-dorilar', description: 'Miltiq uchun o‘q-dori', icon: '🎯', note: 'O‘q-dori' },
]

// OUTPOST UZ v0.4: kengaytirilgan item katalogi (boshlang‘ich ma’lumotlar to‘plami)
items.push(
  { name:'Wood', category:'Resurslar', description:'Qurilish va ko‘plab retseptlar uchun asosiy resurs', icon:'🪵', note:'Resurs' },
  { name:'Stone', category:'Resurslar', description:'Tosh qurilish va ayrim retseptlar uchun ishlatiladi', icon:'🪨', note:'Resurs' },
  { name:'Sulfur', category:'Resurslar', description:'Portlovchi moddalar tayyorlashdagi muhim resurs', icon:'🟡', note:'Resurs' },
  { name:'Metal Ore', category:'Resurslar', description:'Pechda eritib metall fragmentlari olinadi', icon:'⛏️', note:'Ruda' },
  { name:'High Quality Metal', category:'Resurslar', description:'Yuqori darajadagi qurol va jihozlar uchun', icon:'💠', note:'Resurs' },
  { name:'Cloth', category:'Resurslar', description:'Kiyim, tibbiyot va boshqa buyumlar uchun', icon:'🧵', note:'Resurs' },
  { name:'Scrap', category:'Komponentlar', description:'Research va Workbench rivojlantirishda ishlatiladi', icon:'🪙', note:'Valyuta / komponent' },
  { name:'Rifle Body', category:'Komponentlar', description:'Miltiqlarni yasash uchun kerakli komponent', icon:'🔩', note:'Komponent' },
  { name:'SMG Body', category:'Komponentlar', description:'SMG turidagi qurollar uchun komponent', icon:'⚙️', note:'Komponent' },
  { name:'Metal Spring', category:'Komponentlar', description:'Qurol va mexanik buyumlar komponenti', icon:'🌀', note:'Komponent' },
  { name:'Sewing Kit', category:'Komponentlar', description:'Kiyim va zirh retseptlarida ishlatiladi', icon:'🪡', note:'Komponent' },
  { name:'Road Signs', category:'Komponentlar', description:'Himoya kiyimlari tayyorlash uchun komponent', icon:'🪧', note:'Komponent' },
  { name:'Pistol Bullet', category:'O‘q-dorilar', description:'Pistoletlar uchun oddiy o‘q-dori', icon:'🔸', note:'O‘q-dori' },
  { name:'12 Gauge Buckshot', category:'O‘q-dorilar', description:'Shotgun uchun yaqin masofali o‘q-dori', icon:'🟤', note:'O‘q-dori' },
  { name:'HV 5.56 Rifle Ammo', category:'O‘q-dorilar', description:'Yuqori tezlikdagi 5.56 o‘q-dori', icon:'🎯', note:'O‘q-dori' },
  { name:'Medical Syringe', category:'Tibbiyot', description:'Jang vaqtida sog‘liqni tiklashga yordam beradi', icon:'💉', note:'Tibbiyot' },
  { name:'Bandage', category:'Tibbiyot', description:'Qon ketishini to‘xtatish va oz miqdorda davolash', icon:'🩹', note:'Tibbiyot' },
  { name:'Large Medkit', category:'Tibbiyot', description:'Sog‘liqni tiklash uchun tibbiy vosita', icon:'🧰', note:'Tibbiyot' },
  { name:'Coffee Can Helmet', category:'Kiyimlar', description:'Boshlang‘ich himoya dubulg‘asi', icon:'🪖', note:'Kiyim' },
  { name:'Metal Chest Plate', category:'Kiyimlar', description:'Tana uchun metall himoya zirhi', icon:'🥋', note:'Kiyim' },
  { name:'Hoodie', category:'Kiyimlar', description:'Sovuqdan va ayrim zararlardan himoya qiluvchi kiyim', icon:'🧥', note:'Kiyim' },
  { name:'Garage Door', category:'Qurilish', description:'Katta ochiladigan metall eshik', icon:'🚧', note:'Qurilish' },
  { name:'High External Stone Wall', category:'Qurilish', description:'Bazani tashqi tomondan himoyalash devori', icon:'🧱', note:'Qurilish' },
  { name:'Auto Turret', category:'Qurilish', description:'Bazani himoya qiluvchi avtomatik mudofaa qurilmasi', icon:'🤖', note:'Mudofaa' },
  { name:'Flame Turret', category:'Qurilish', description:'Yaqin masofadagi hududni olov bilan himoya qiladi', icon:'🔥', note:'Mudofaa' },
  { name:'Explosives', category:'Komponentlar', description:'Portlovchi qurollar va zaryadlar uchun material', icon:'🧨', note:'Komponent' },
  { name:'Low Grade Fuel', category:'Resurslar', description:'Transport, pech va ayrim qurilmalarda yoqilg‘i', icon:'⛽', note:'Resurs' },
  { name:'Animal Fat', category:'Resurslar', description:'Low Grade Fuel tayyorlashda ishlatiladi', icon:'🥩', note:'Resurs' },
  { name:'Leather', category:'Resurslar', description:'Hayvonlardan olinadigan charm materiali', icon:'🟫', note:'Resurs' },
  { name:'Tech Trash', category:'Komponentlar', description:'Yuqori darajadagi elektronika komponenti', icon:'💾', note:'Komponent' },
  { name:'Rocket Launcher', category:'Qurollar', description:'Raketalarni otuvchi portlovchi qurol', icon:'🚀', note:'Qurol' },
  { name:'Rocket', category:'O‘q-dorilar', description:'Rocket Launcher uchun asosiy raketa', icon:'🚀', note:'O‘q-dori' },
  { name:'High Velocity Rocket', category:'O‘q-dorilar', description:'Yuqori tezlikka ega raketa turi', icon:'🚀', note:'O‘q-dori' },
  { name:'Incendiary Rocket', category:'O‘q-dorilar', description:'Portlashdan so‘ng olov hosil qiluvchi raketa', icon:'🔥', note:'O‘q-dori' },
  { name:'Satchel Charge', category:'Qurollar', description:'Masofadan portlovchi raid vositasi', icon:'💣', note:'Portlovchi' },
  { name:'Beancan Grenade', category:'Qurollar', description:'Qo‘lbola portlovchi granata', icon:'💣', note:'Portlovchi' },
  { name:'F1 Grenade', category:'Qurollar', description:'Parchalanuvchi qo‘l granatasi', icon:'💣', note:'Portlovchi' },
  { name:'Metal Facemask', category:'Kiyimlar', description:'Bosh uchun metall himoya niqobi', icon:'🪖', note:'Himoya' },
  { name:'Road Sign Kilt', category:'Kiyimlar', description:'Oyoq va bel qismi uchun yo‘l belgisi zirhi', icon:'🦺', note:'Himoya' },
  { name:'Hazmat Suit', category:'Kiyimlar', description:'Radiatsiya va atrof-muhitdan himoya kostyumi', icon:'🥽', note:'Himoya' },
  { name:'Tactical Gloves', category:'Kiyimlar', description:'Qo‘l uchun himoya qo‘lqoplari', icon:'🧤', note:'Kiyim' },
  { name:'Boots', category:'Kiyimlar', description:'Oyoq kiyimi', icon:'🥾', note:'Kiyim' },
  { name:'Hatchet', category:'Asboblar', description:'Yog‘och yig‘ish va yaqin jang uchun asbob', icon:'🪓', note:'Asbob' },
  { name:'Pickaxe', category:'Asboblar', description:'Tosh va ruda qazish uchun asbob', icon:'⛏️', note:'Asbob' },
  { name:'Stone Pickaxe', category:'Asboblar', description:'Boshlang‘ich darajadagi qazish asbobi', icon:'⛏️', note:'Asbob' },
  { name:'Jackhammer', category:'Asboblar', description:'Ruda qazishni tezlashtiruvchi pnevmatik asbob', icon:'🔨', note:'Asbob' },
  { name:'Chainsaw', category:'Asboblar', description:'Yog‘och yig‘ish uchun motorli arra', icon:'🪚', note:'Asbob' },
  { name:'Sleeping Bag', category:'Qurilish', description:'Qayta tirilish nuqtasini belgilash uchun', icon:'🛏️', note:'Deployable' },
  { name:'Tool Cupboard', category:'Qurilish', description:'Building privilege va upkeep boshqaruvi', icon:'🗄️', note:'Deployable' },
  { name:'Code Lock', category:'Qurilish', description:'Eshik va konteynerlarni kod bilan qulflash', icon:'🔐', note:'Qulf' },
  { name:'Key Lock', category:'Qurilish', description:'Eshik va konteynerlar uchun kalitli qulf', icon:'🔑', note:'Qulf' },
  { name:'Large Wooden Box', category:'Qurilish', description:'Buyumlarni saqlash uchun katta konteyner', icon:'📦', note:'Saqlash' },
  { name:'Furnace', category:'Qurilish', description:'Ruda va boshqa materiallarni eritish pechi', icon:'🔥', note:'Ishlab chiqarish' },
  { name:'Large Furnace', category:'Qurilish', description:'Ko‘p miqdordagi rudani eritish uchun katta pech', icon:'🔥', note:'Ishlab chiqarish' },
  { name:'Research Table', category:'Qurilish', description:'Topilgan buyumdan blueprint o‘rganish stoli', icon:'📚', note:'Ish stoli' },
  { name:'Workbench Level 1', category:'Qurilish', description:'Boshlang‘ich crafting ish stoli', icon:'🛠️', note:'Ish stoli' },
  { name:'Workbench Level 2', category:'Qurilish', description:'O‘rta darajadagi crafting ish stoli', icon:'🛠️', note:'Ish stoli' },
  { name:'Workbench Level 3', category:'Qurilish', description:'Yuqori darajadagi crafting ish stoli', icon:'🛠️', note:'Ish stoli' },
  { name:'Shotgun Trap', category:'Tuzoqlar', description:'Yaqin masofada ishlaydigan avtomatik tuzoq', icon:'💥', note:'Mudofaa' },
  { name:'Wind Turbine', category:'Elektrika', description:'Shamoldan elektr energiyasi ishlab chiqaradi', icon:'🌬️', note:'Elektrika' },
  { name:'Solar Panel', category:'Elektrika', description:'Quyosh nuri orqali elektr energiyasi ishlab chiqaradi', icon:'☀️', note:'Elektrika' },
  { name:'Small Rechargeable Battery', category:'Elektrika', description:'Elektr energiyasini saqlash qurilmasi', icon:'🔋', note:'Elektrika' },
  { name:'Large Rechargeable Battery', category:'Elektrika', description:'Katta sig‘imli elektr energiyasi saqlagich', icon:'🔋', note:'Elektrika' },
  { name:'Electrical Branch', category:'Elektrika', description:'Elektr zanjiridan quvvat ajratib beradi', icon:'🔌', note:'Elektrika' },
  { name:'CCTV Camera', category:'Elektrika', description:'Masofadan kuzatish kamerasi', icon:'📹', note:'Elektrika' },
  { name:'RF Receiver', category:'Elektrika', description:'Radio signalni qabul qiluvchi qurilma', icon:'📡', note:'Elektrika' },
  { name:'Water Purifier', category:'Qurilish', description:'Sho‘r suvni ichimlik suviga aylantiradi', icon:'🚰', note:'Deployable' },
  { name:'Corn', category:'Oziq-ovqat', description:'Oziq-ovqat va urug‘ manbai', icon:'🌽', note:'Oziq-ovqat' },
  { name:'Pumpkin', category:'Oziq-ovqat', description:'Oziq-ovqat sifatida iste’mol qilinadi', icon:'🎃', note:'Oziq-ovqat' },
  { name:'Mushroom', category:'Oziq-ovqat', description:'Yovvoyi holda topiladigan oziq-ovqat', icon:'🍄', note:'Oziq-ovqat' },
  { name:'Cooked Wolf Meat', category:'Oziq-ovqat', description:'Pishirilgan go‘sht oziq-ovqat va kaloriyani tiklaydi', icon:'🍖', note:'Oziq-ovqat' },
  { name:'Water Jug', category:'Oziq-ovqat', description:'Suv tashish uchun idish', icon:'🫗', note:'Ichimlik' },
  { name:'Small Stash', category:'Qurilish', description:'Buyumlarni yer ostiga yashirish uchun kichik konteyner', icon:'👜', note:'Saqlash' },
  { name:'Metal Pipe', category:'Komponentlar', description:'Qurol va boshqa retseptlarda ishlatiladigan metall komponent', icon:'🔩', note:'Komponent' },
  { name:'Gears', category:'Komponentlar', description:'Mexanik qurilmalar va retseptlar uchun komponent', icon:'⚙️', note:'Komponent' },
  { name:'Rope', category:'Komponentlar', description:'Satchel Charge kabi retseptlarda ishlatiladigan material', icon:'🪢', note:'Komponent' },
)

const weaponProfiles = [
  {name:'Assault Rifle (AK)',type:'Avtomatik miltiq',ammo:'5.56 Rifle Ammo',tier:'Yuqori',role:'O‘rta va uzoq masofadagi janglar',desc:'Kuchli avtomatik miltiq. Spray nazorati va recoil mashqi muhim.',craft:'Workbench 3',icon:'🔫'},
  {name:'LR-300 Assault Rifle',type:'Avtomatik miltiq',ammo:'5.56 Rifle Ammo',tier:'Yuqori',role:'O‘rta masofa',desc:'Barqaror avtomatik otish uchun mo‘ljallangan harbiy miltiq.',craft:'Craft qilinmaydi',icon:'🎯'},
  {name:'MP5A4',type:'SMG',ammo:'5.56 Rifle Ammo',tier:'O‘rta',role:'Yaqin va o‘rta masofa',desc:'Tezkor otish sur’atiga ega avtomat. Yaqin janglarda qulay.',craft:'Workbench 3',icon:'🔫'},
  {name:'Thompson',type:'SMG',ammo:'Pistol Bullet',tier:'O‘rta',role:'Yaqin masofa',desc:'Erta va o‘rta bosqich uchun ommabop avtomat.',craft:'Workbench 2',icon:'🔫'},
  {name:'Custom SMG',type:'SMG',ammo:'Pistol Bullet',tier:'Boshlang‘ich',role:'Yaqin masofa',desc:'Nisbatan sodda avtomat; yaqin janglarda samarali.',craft:'Workbench 2',icon:'🔫'},
  {name:'Semi-Automatic Rifle',type:'Yarim avtomatik miltiq',ammo:'5.56 Rifle Ammo',tier:'O‘rta',role:'O‘rta va uzoq masofa',desc:'Aniq yarim avtomatik otish uchun mos universal miltiq.',craft:'Workbench 2',icon:'🎯'},
  {name:'Bolt Action Rifle',type:'Snayper miltig‘i',ammo:'5.56 Rifle Ammo',tier:'Yuqori',role:'Uzoq masofa',desc:'Kuchli bir martalik o‘q va optik nishonga olish imkoniyati.',craft:'Workbench 3',icon:'🎯'},
  {name:'Python Revolver',type:'Pistolet',ammo:'Pistol Bullet',tier:'O‘rta',role:'Yaqin va o‘rta masofa',desc:'Katta zarbali revolver. O‘qni aniq ishlatish muhim.',craft:'Workbench 3',icon:'🔫'},
  {name:'Revolver',type:'Pistolet',ammo:'Pistol Bullet',tier:'Boshlang‘ich',role:'Yaqin masofa',desc:'Boshlang‘ich bosqichda qo‘l keladigan sodda pistolet.',craft:'Workbench 1',icon:'🔫'},
  {name:'Pump Shotgun',type:'Shotgun',ammo:'12 Gauge Buckshot',tier:'O‘rta',role:'Juda yaqin masofa',desc:'Bino ichidagi janglarda kuchli yaqin masofa quroli.',craft:'Workbench 2',icon:'💥'},
  {name:'Double Barrel Shotgun',type:'Shotgun',ammo:'12 Gauge Buckshot',tier:'Boshlang‘ich',role:'Juda yaqin masofa',desc:'Ikki o‘qli shotgun; pistirma va yaqin janglar uchun.',craft:'Workbench 1',icon:'💥'},
  {name:'M249',type:'Yengil pulemyot',ammo:'5.56 Rifle Ammo',tier:'Harbiy',role:'Uzoq davom etadigan jang',desc:'Katta magazinli kuchli pulemyot. Odatda noyob loot sifatida uchraydi.',craft:'Craft qilinmaydi',icon:'🔥'},
  {name:'Rocket Launcher',type:'Portlovchi qurol',ammo:'Rocket / HV Rocket / Incendiary Rocket',tier:'Yuqori',role:'Raid va splash damage',desc:'Turli raketa turlarini otuvchi qurol. Raketa turiga qarab vazifasi farq qiladi.',craft:'Workbench 2',icon:'🚀'},
]
const blueprintGuides = [
  {name:'Workbench Level 1',group:'Ish stollari',cost:'500 Wood · 100 Metal Fragments',level:'Talab qilinmaydi',note:'Boshlang‘ich craft stoli.'},
  {name:'Workbench Level 2',group:'Ish stollari',cost:'500 Metal Fragments · 20 HQM · 5 Basic Blueprint Fragment',level:'Workbench 1',note:'O‘rta darajadagi retseptlarni ochadi.'},
  {name:'Workbench Level 3',group:'Ish stollari',cost:'1,000 Metal Fragments · 100 HQM · 20 Advanced Blueprint Fragment',level:'Workbench 2',note:'Yuqori darajadagi retseptlar uchun.'},
  {name:'Research Table',group:'Qurilish',cost:'200 Metal Fragments · 20 Scrap',level:'Workbench 1',note:'Topilgan buyum blueprintini o‘rganish uchun.'},
  {name:'Timed Explosive Charge (C4)',group:'Portlovchilar',cost:'20 Explosives · 5 Cloth · 2 Tech Trash',level:'Workbench 3',note:'Katta portlovchi zaryad.'},
  {name:'Satchel Charge',group:'Portlovchilar',cost:'4 Beancan Grenade · 1 Rope · 1 Small Stash',level:'Workbench 1',note:'Erta bosqichdagi raid vositasi.'},
  {name:'Assault Rifle (AK)',group:'Qurollar',cost:'200 Wood · 50 HQM · 4 Metal Spring · 1 Rifle Body',level:'Workbench 3',note:'Avtomatik miltiq retsepti.'},
  {name:'Metal Facemask',group:'Kiyimlar',cost:'50 Leather · 15 HQM · 6 Sewing Kit',level:'Workbench 3',note:'Bosh uchun himoya zirhi.'},
  {name:'Garage Door',group:'Qurilish',cost:'300 Metal Fragments · 2 Gears',level:'Workbench 2',note:'Bazalar uchun keng eshik.'},
  {name:'Auto Turret',group:'Mudofaa',cost:'10 HQM · 1 CCTV Camera · 1 Targeting Computer',level:'Workbench 2',note:'Elektr bilan ishlaydigan avtomatik himoya.'},
  {name:'Medical Syringe',group:'Tibbiyot',cost:'15 Cloth · 10 Metal Fragments · 10 Low Grade Fuel',level:'Workbench 2',note:'Jangda tez davolanish uchun.'},
  {name:'Rocket Launcher',group:'Qurollar',cost:'100 Metal Fragments · 10 HQM · 2 Pipes',level:'Workbench 2',note:'Raketa otish qurilmasi.'},
]


const targets: Target[] = [
  { id:'twig', name:'Shox-shabba devor / pol', group:'Qurilish bloklari', hp:10, c4:1, rocket:1, satchel:1, ammo:2, beancan:1 },
  { id:'wood-wall', name:'Yog‘och devor / pol', group:'Qurilish bloklari', hp:250, c4:1, rocket:2, satchel:3, ammo:49, beancan:13 },
  { id:'stone-wall', name:'Tosh devor / pol', group:'Qurilish bloklari', hp:500, c4:2, rocket:4, satchel:10, ammo:185, beancan:46 },
  { id:'metal-wall', name:'Temir devor / pol', group:'Qurilish bloklari', hp:1000, c4:4, rocket:8, satchel:23, ammo:400, beancan:112 },
  { id:'armored-wall', name:'Zirhli devor / pol', group:'Qurilish bloklari', hp:2000, c4:8, rocket:15, satchel:46, ammo:799, beancan:223 },
  { id:'wood-door', name:'Yog‘och eshik', group:'Eshiklar', hp:200, c4:1, rocket:1, satchel:2, ammo:19, beancan:6 },
  { id:'metal-door', name:'Temir eshik', group:'Eshiklar', hp:250, c4:1, rocket:2, satchel:4, ammo:63, beancan:18 },
  { id:'garage-door', name:'Garaj eshigi', group:'Eshiklar', hp:600, c4:2, rocket:3, satchel:9, ammo:150, beancan:42 },
  { id:'armored-door', name:'Zirhli eshik', group:'Eshiklar', hp:1000, c4:3, rocket:4, satchel:15, ammo:250, beancan:69 },
  { id:'wood-double', name:'Ikki tabaqali yog‘och eshik', group:'Eshiklar', hp:200, c4:1, rocket:1, satchel:2, ammo:19, beancan:6 },
  { id:'metal-double', name:'Ikki tabaqali temir eshik', group:'Eshiklar', hp:250, c4:1, rocket:2, satchel:4, ammo:63, beancan:18 },
  { id:'high-wood', name:'Baland yog‘och devor', group:'Tashqi devorlar', hp:500, c4:2, rocket:3, satchel:6, ammo:98, beancan:36 },
  { id:'high-stone', name:'Baland tosh devor', group:'Tashqi devorlar', hp:500, c4:2, rocket:4, satchel:10, ammo:185, beancan:64 },
]
const methods: {id: RaidMethod; label: string; short: string; sulfur: number}[] = [
  { id:'c4', label:'C4 (Timed Explosive Charge)', short:'C4', sulfur:2200 },
  { id:'rocket', label:'Rocket', short:'Raketa', sulfur:1400 },
  { id:'satchel', label:'Satchel Charge', short:'Satchel', sulfur:480 },
  { id:'ammo', label:'Explosive 5.56 Ammo', short:'Explosive ammo', sulfur:25 },
  { id:'beancan', label:'Beancan Grenade', short:'Beancan', sulfur:120 },
]

const monuments = [
  { name:'Outpost', type:'Xavfsiz hudud', size:'Safe zone', desc:'Savdo avtomatlari, qayta ishlash, ish stollari va xavfsiz savdo imkoniyatlari mavjud bo‘lgan hudud.', tips:['Hudud ichida qurol ishlatmang va boshqa o‘yinchilarga zarar yetkazmang.','Savdo avtomatlari va qayta ishlash uskunalaridan foydalaning.'], loot:'Asosiy foyda: savdo, qayta ishlash va xizmatlar.', color:'green' },
  { name:'Bandit Camp', type:'Xavfsiz hudud', size:'Safe zone', desc:'NPC savdogarlari va qimor o‘yinlari joylashgan xavfsiz savdo hududi.', tips:['Savdo va resurs almashinuvi uchun boring.','Hudud qoidalariga rioya qiling.'], loot:'Asosiy foyda: savdo va maxsus xizmatlar.', color:'green' },
  { name:'Fishing Village', type:'Xavfsiz hudud', size:'Safe zone', desc:'Baliq ovlash va dengiz transportiga oid xizmatlar mavjud qirg‘oq hududi.', tips:['Qayiq va baliq ovlash bilan bog‘liq xizmatlarni tekshiring.','Suv bo‘ylab harakatlanish uchun qulay nuqta.'], loot:'Asosiy foyda: dengiz xizmatlari va savdo.', color:'green' },
  { name:'Abandoned Supermarket', type:'Kichik monument', size:'Small', desc:'Oziq-ovqat va kundalik buyumlar qidirish mumkin bo‘lgan kichik monument.', tips:['Atrofdagi yo‘llarni tekshiring.','Boshqa o‘yinchilar kelishi mumkin — ehtiyot bo‘ling.'], loot:'Odatda oddiy loot konteynerlari va barrel/bochkalarga e’tibor bering.', color:'blue' },
  { name:'Lighthouse', type:'Kichik monument', size:'Small', desc:'Sohil bo‘yida joylashadigan mayoq. Yangi boshlovchilar uchun loot qidirish nuqtasi.', tips:['Mayoqning yuqori qismlarini ham tekshiring.','Sohil bo‘ylab barrel va konteynerlarni qidiring.'], loot:'Oddiy loot va qayta ishlashga yaroqli komponentlar.', color:'blue' },
  { name:'Mining Outpost', type:'Kichik monument', size:'Small', desc:'Konchilik mavzusidagi kichik hudud. Yo‘l bo‘yidagi resurs va konteynerlarni qidirish mumkin.', tips:['Hudud atrofidagi barrel va qutilarni tekshiring.','Yaqin atrofdagi yo‘llarni ham aylaning.'], loot:'Oddiy loot konteynerlari va komponentlar.', color:'blue' },
  { name:'Oxum’s Gas Station', type:'Kichik monument', size:'Small', desc:'Yoqilg‘i shoxobchasi ko‘rinishidagi monument. Loot va qayta ishlash uchun foydali bo‘lishi mumkin.', tips:['Binoning ichki qismlari va tomini tekshiring.','Recycler mavjudligini serverdagi joriy holat bo‘yicha tekshiring.'], loot:'Konteynerlar, barrel va komponentlar.', color:'blue' },
  { name:'Abandoned Cabins', type:'Kichik monument', size:'Small', desc:'O‘rmon hududida uchraydigan tashlandiq kulbalar majmuasi.', tips:['Kulbalar orasini va tashqi hududni tekshiring.','Atrofdagi xavflarga e’tibor bering.'], loot:'Oddiy konteynerlar va resurslar.', color:'blue' },
  { name:'Airfield', type:'Katta monument', size:'Large', desc:'Keng aerodrom hududi. Bir nechta bino, angar va yerosti yo‘laklari mavjud.', tips:['Hudud katta — kirishdan oldin chiqish yo‘lini rejalashtiring.','Radiatsiya va boshqa o‘yinchilarga tayyor bo‘ling.','Puzzle mavjud bo‘lgan eshiklar uchun kerakli kartalarni olib boring.'], loot:'Yuqori darajadagi konteynerlar va harbiy loot imkoniyati.', color:'orange' },
  { name:'Train Yard', type:'Katta monument', size:'Large', desc:'Temiryo‘l infratuzilmasi, vagonlar va sanoat binolaridan iborat monument.', tips:['Baland nuqtalar va vagonlarni tekshiring.','Puzzle xonasi uchun kerakli kartalarni tayyorlang.','Hudud ochiq bo‘lgani uchun snayperlardan ehtiyot bo‘ling.'], loot:'Harbiy va sanoat loot konteynerlari.', color:'orange' },
  { name:'Water Treatment Plant', type:'Katta monument', size:'Large', desc:'Suv tozalash inshootlari va quvurlardan iborat yirik sanoat hududi.', tips:['Binolar ichini va quvur yo‘laklarini tekshiring.','Puzzle yo‘nalishini oldindan o‘rganing.','Radiatsiya himoyasini unutmang.'], loot:'Sanoat va harbiy loot konteynerlari.', color:'orange' },
  { name:'Power Plant', type:'Katta monument', size:'Large', desc:'Elektr stansiyasi va texnik inshootlardan iborat murakkab monument.', tips:['Inshootlar orasidagi yo‘laklarni o‘rganing.','Puzzle uchun kerakli kartalarni olib boring.','Hududni to‘liq aylanib chiqishga vaqt ajrating.'], loot:'Sanoat va harbiy konteynerlar.', color:'orange' },
  { name:'Launch Site', type:'Katta monument', size:'Large', desc:'Raketa uchirish majmuasi. Keng, xavfli va yuqori darajadagi loot imkoniyatlariga ega.', tips:['Yuqori radiatsiya xavfiga tayyorlaning.','Himoya kiyimi va davolovchi vositalar olib boring.','Bradley APC xavfini hisobga oling.'], loot:'Yuqori darajadagi harbiy loot. Bradley APC mavjud.', color:'red' },
  { name:'Military Tunnels', type:'Katta monument', size:'Large', desc:'Yerosti harbiy tunnel tizimi. Kuchli NPC himoyasi sababli yaxshi tayyorgarlik talab qiladi.', tips:['Kuchli qurol, o‘q-dori va davolovchi vositalar oling.','Tunnel ichida yo‘nalishni yo‘qotmaslik uchun belgilarni kuzating.','NPC bilan jangga tayyor bo‘ling.'], loot:'Harbiy konteynerlar va yuqori darajadagi loot.', color:'red' },
  { name:'The Dome', type:'O‘rta monument', size:'Medium', desc:'Katta gumbazli sanoat inshooti. Tepaga ko‘tarilish yo‘li va atrofdagi loot nuqtalari bilan tanilgan.', tips:['Tepaga chiqishda yiqilish xavfiga e’tibor bering.','Atrofdagi konteyner va barrelni ham tekshiring.'], loot:'Harbiy/sanoat konteynerlari.', color:'orange' },
  { name:'Large Oil Rig', type:'Dengiz monumenti', size:'Large', desc:'Dengizdagi yirik neft platformasi. Kuchli NPC qarshiligi va yuqori darajadagi loot mavjud.', tips:['Qayiq yoki boshqa dengiz transportini rejalashtiring.','Kuchli qurol va yetarli o‘q-dori oling.','Heavy Scientist jangiga tayyor bo‘ling.'], loot:'Yuqori darajadagi harbiy loot va locked crate.', color:'red' },
  { name:'Small Oil Rig', type:'Dengiz monumenti', size:'Medium', desc:'Kichik neft platformasi. Dengizdagi loot marshruti va locked crate imkoniyati bilan mashhur.', tips:['Dengiz transporti va qaytish yo‘lini oldindan belgilang.','NPC larni bittalab tozalashga harakat qiling.'], loot:'Harbiy loot va locked crate.', color:'red' },
  { name:'Cargo Ship', type:'Dengiz monumenti', size:'Large', desc:'Xarita bo‘ylab harakatlanuvchi yirik kema monumenti.', tips:['Kemaga chiqishdan oldin qochish yo‘lini rejalashtiring.','NPC va boshqa o‘yinchilarga tayyor bo‘ling.','Locked crate vaqtini kuzating.'], loot:'Yuqori darajadagi loot va locked crate.', color:'red' },
  { name:'Arctic Research Base', type:'Katta monument', size:'Large', desc:'Qorli biomdagi tadqiqot bazasi. Sovuq muhit va harbiy loot imkoniyatlariga ega.', tips:['Sovuqdan himoyalovchi kiyim oling.','Binolar va tashqi yo‘laklarni tekshiring.'], loot:'Harbiy va ilmiy mavzudagi konteynerlar.', color:'orange' },
]



type MonumentPuzzle = { cards:string; fuses:string; route:string[]; reward:string; note?:string }
// Real Rust in-game screenshots hosted by their original publishers.
const monumentImages: Record<string,string> = {
  'Airfield': 'https://static.wikia.nocookie.net/play-rust/images/7/70/Airfield_main_view.jpg/revision/latest/scale-to-width-down/1200?cb=20161122165909',
  'Train Yard': 'https://eip.gg/wp-content/uploads/2022/08/New-Train.jpg',
  'Power Plant': 'https://staticg.sportskeeda.com/editor/2024/09/ae0c5-17261211910451-1920.jpg',
  'Water Treatment Plant': 'https://staticg.sportskeeda.com/editor/2025/10/cd883-17597191979351-1920.jpg',
  'Launch Site': 'https://cdn-ak.f.st-hatena.com/images/fotolife/g/game-lab/20240410/20240410004239.jpg',
  'Military Tunnels': 'https://images.squarespace-cdn.com/content/v1/5420d068e4b09194f76b2af6/1528945671472-76T0QN9N5V52O2LOZ9C2/image-asset.png?format=2500w',
  'The Dome': 'https://lone.design/wp-content/uploads/2023/11/RustClient_TwdEobhWgY-1536x864.jpg',
  'Large Oil Rig': 'https://xboxplay.games/uploadStream/16905.jpg',
  'Small Oil Rig': 'https://www.4noobs.co/api/wiki/image-proxy?url=https%3A%2F%2Fcdn.4noobs.co%2FR4N%2Fwiki%2Fsmall-oil-rig.png',
  'Cargo Ship': 'https://files.facepunch.com/s/acb148eedcae.png',
  'Lighthouse': 'https://cdn.vartolo.net/Pages/Rust-Monument/images/Lighthouse.jpg',
  'Arctic Research Base': 'https://luridan.com/pictures/rust-8-2022-10.jpg',
  'Sewer Branch': 'https://staticg.sportskeeda.com/editor/2026/01/bc949-17686345590966-1920.jpg?w=1600',
  'Satellite Dish': 'https://images.squarespace-cdn.com/content/v1/5420d068e4b09194f76b2af6/1496335264638-WZG5UC2HTURWC64TX9GQ/20170601115323_1.jpg?format=1000w',
  'Abandoned Supermarket': 'https://www.gamingonlinux.com/uploads/articles/article_media/14176706571504812791gol1.jpg',
  'Oxum’s Gas Station': 'https://static.wixstatic.com/media/e2b728_24be5129a1574ba8879cbd2b38b28cbe~mv2.png/v1/fill/w_1000%2Ch_667%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01/e2b728_24be5129a1574ba8879cbd2b38b28cbe~mv2.png',
}

const monumentStats: Record<string,{tier:string;crates:string;barrels:string;scientists:string;recyclers:string;radiation:string}> = {
  'Airfield':{tier:'Tier 2',crates:'29',barrels:'11',scientists:'3',recyclers:'2',radiation:'11'},
  'Train Yard':{tier:'Tier 2',crates:'30',barrels:'15',scientists:'4',recyclers:'1',radiation:'11 (max 26)'},
  'Power Plant':{tier:'Tier 3',crates:'31',barrels:'15',scientists:'0',recyclers:'3 green + 1 red',radiation:'0 (max 52)'},
  'Water Treatment Plant':{tier:'Tier 2',crates:'34',barrels:'13',scientists:'0',recyclers:'1',radiation:'0 (max 26)'},
  'Launch Site':{tier:'Tier 3',crates:'85',barrels:'64',scientists:'8',recyclers:'1',radiation:'11 (max 52)'},
}
const monumentSourceUrls: Record<string,string> = {
  'Airfield':'https://rusthelp.com/monument/airfield',
  'Train Yard':'https://rusthelp.com/monument/train-yard',
  'Power Plant':'https://rusthelp.com/monument/power-plant',
  'Water Treatment Plant':'https://rusthelp.com/monument/water-treatment-plant',
  'Launch Site':'https://rusthelp.com/monument/launch-site',
}
const monumentPuzzles: Record<string,MonumentPuzzle> = {
  'Airfield': { cards:'Green + Blue', fuses:'2 × Electric Fuse', route:['Ikki elektr switchini faollashtiring.','Asosiy puzzle binosiga o‘ting va fuse box’ga 1 ta fuse joylang.','Timer switchni yoqing, Green Keycard bilan ixtiyoriy xonani tekshiring.','Yuqori qavatda Blue Keycard’ni swipe qiling va lootni oling.'], reward:'Red Keycard, harbiy loot va blueprint fragmentlar', note:'Ikkinchi fuse alohida elektr zanjiri/puzzle bosqichiga kerak bo‘lishi mumkin; serverdagi joriy holatni tekshiring.' },
  'Train Yard': { cards:'Blue (Green — ixtiyoriy xona uchun)', fuses:'1 × Electric Fuse', route:['Asosiy puzzle binosiga qarama-qarshi binodagi switchni yoqing.','Minoradagi yuqori qavat switchini faollashtiring.','Puzzle binosiga kiring va orqa tomondagi fuse box’ga fuse qo‘ying.','Timer switchni yoqing, yuqoriga ko‘tarilib Blue Keycard’ni swipe qiling.'], reward:'Red Keycard va Military Crates' },
  'Power Plant': { cards:'Green + Blue', fuses:'1 × Electric Fuse', route:['Green va Blue Keycard hamda Electric Fuse olib boring.','Puzzle binosidagi elektr zanjirini yoqing.','Kerakli switchlarni ketma-ket faollashtirib timerga yetib boring.','Blue Keycard bilan loot xonasini oching.'], reward:'Red Keycard va yuqori darajadagi loot', note:'Power Plant’da Heavy Fuse bilan bog‘liq alohida elektr tarmog‘i ham bor; bu oddiy Electric Fuse puzzle’dan farq qiladi.' },
  'Water Treatment Plant': { cards:'Blue', fuses:'1 × Electric Fuse', route:['Monument ichidagi fuse box’ni toping.','Electric Fuse joylang va yaqin switchni yoqing.','Timer tugashidan oldin Blue Keycard’ni reader’da swipe qiling.','Loot xonasini tekshirib, xavfsiz chiqish yo‘lidan qayting.'], reward:'Red Keycard va Military Crates' },
  'Launch Site': { cards:'Green + Red', fuses:'2 × Electric Fuse', route:['Radiatsiyaga qarshi kiyim, Green va Red Keycard olib boring.','Puzzle uchun belgilangan ikki fuse box’ga fuse joylang.','Kerakli switchlarni faollashtirib timer oynasida eshikka yetib boring.','Red Keycard bilan yuqori darajadagi loot xonasini oching.'], reward:'Elite loot va yuqori darajadagi harbiy konteynerlar', note:'Launch Site’dagi elektr grid va loot room talablari yangilanishlarga qarab o‘zgarishi mumkin.' },
  'Sewer Branch': { cards:'Green', fuses:'1 × Electric Fuse', route:['Yerosti tunneliga kirib fuse box’ni toping.','Electric Fuse joylang va switchni yoqing.','Timer tugashidan oldin Green Keycard’ni swipe qiling.','Xonadagi lootni oling va tunnel orqali chiqing.'], reward:'Blue Keycard va Military Crates' },
  'Satellite Dish': { cards:'Green', fuses:'1 × Electric Fuse', route:['Asosiy binodagi fuse box’ni toping.','Electric Fuse joylang va elektr switchni yoqing.','Green Keycard’ni reader’da swipe qiling.','Loot xonasini tekshirib, tashqariga chiqing.'], reward:'Blue Keycard va konteynerlar' },
  'The Dome': { cards:'Green', fuses:'1 × Electric Fuse', route:['Dome atrofidagi fuse box va elektr switchni toping.','Electric Fuse joylang va switchni yoqing.','Green Keycard’ni reader’da swipe qiling.','Blue Keycard va blueprint fragmentini olib, xavfsiz chiqing.'], reward:'Blue Keycard va Basic Blueprint Fragment' },
  'Arctic Research Base': { cards:'Blue', fuses:'Standart puzzle uchun fuse ko‘rsatilmagan', route:['Sovuqdan himoyalovchi kiyim va Blue/Red kartalar bilan tayyorlaning.','Binolar ichidagi switch va card reader yo‘nalishini kuzating.','Red Keycard bilan yopiq xonani oching.','NPC va radiatsiya xavfini nazorat qiling.'], reward:'Harbiy loot va puzzle konteynerlari' },
  'Large Oil Rig': { cards:'Red (xona bo‘yicha farq qiladi)', fuses:'1 × Electric Fuse (fuse xonasi)', route:['Qayiq yoki RHIB bilan platformaga yaqinlashing.','Pastki qavatlarni tozalab, yuqoriga ko‘tariling.','Fuse xonasida Electric Fuse va switchdan foydalaning.','Kerakli card reader orqali loot xonasiga kiring.','Locked Crate’ni ochishdan oldin chiqish rejasini tayyorlang.'], reward:'Elite Military Crates va Locked Crate' },
  'Small Oil Rig': { cards:'Blue / Red — xona bo‘yicha', fuses:'1 × Electric Fuse (fuse xonasi)', route:['Dengiz transporti bilan platformaga boring.','NPC’larni qavatma-qavat tozalang.','Fuse xonasini ishga tushiring va card reader’ni toping.','Locked Crate taymerini kuzatib, lootni oling.'], reward:'Military loot va Locked Crate' },
  'Military Tunnels': { cards:'Green + Blue + Red — xonaga qarab', fuses:'Puzzle yo‘liga qarab farq qiladi', route:['Kuchli qurol, ko‘p o‘q-dori va medkit olib boring.','Tunnel ichidagi NPC’larni ehtiyotkorlik bilan tozalang.','Rangli kartalar bilan tegishli eshiklarni oching.','Chuqur loot xonasiga kirishdan oldin chiqish yo‘lini belgilang.'], reward:'Elite/Military loot', note:'Tunnel ichidagi ko‘p bosqichli eshiklar sababli yagona fuse sonini ko‘rsatish noto‘g‘ri bo‘lishi mumkin.' },
}

type RecycleItem = { name:string; category:string; yields:{name:string;amount:number}[] }
const recycleItems: RecycleItem[] = [
 {name:'Gears',category:'Komponentlar',yields:[{name:'Scrap',amount:12},{name:'Metal Fragments',amount:15}]},
 {name:'Metal Blade',category:'Komponentlar',yields:[{name:'Scrap',amount:2},{name:'Metal Fragments',amount:18}]},
 {name:'Metal Pipe',category:'Komponentlar',yields:[{name:'Scrap',amount:6},{name:'High Quality Metal',amount:0.2}]},
 {name:'Metal Spring',category:'Komponentlar',yields:[{name:'Scrap',amount:12},{name:'High Quality Metal',amount:0.2}]},
 {name:'Road Signs',category:'Komponentlar',yields:[{name:'Scrap',amount:6},{name:'High Quality Metal',amount:0.2}]},
 {name:'Rope',category:'Komponentlar',yields:[{name:'Cloth',amount:18}]},
 {name:'Sewing Kit',category:'Komponentlar',yields:[{name:'Cloth',amount:12},{name:'Rope',amount:1}]},
 {name:'Sheet Metal',category:'Komponentlar',yields:[{name:'Scrap',amount:9},{name:'Metal Fragments',amount:120},{name:'High Quality Metal',amount:0.2}]},
 {name:'Tarp',category:'Komponentlar',yields:[{name:'Cloth',amount:60}]},
 {name:'Tech Trash',category:'Komponentlar',yields:[{name:'Scrap',amount:24},{name:'High Quality Metal',amount:0.2}]},
 {name:'Rifle Body',category:'Komponentlar',yields:[{name:'Scrap',amount:30},{name:'High Quality Metal',amount:0.8}]},
 {name:'Semi Automatic Body',category:'Komponentlar',yields:[{name:'Scrap',amount:18},{name:'High Quality Metal',amount:0.8},{name:'Metal Fragments',amount:90}]},
 {name:'SMG Body',category:'Komponentlar',yields:[{name:'Scrap',amount:18},{name:'High Quality Metal',amount:0.8}]},
 {name:'Electric Fuse',category:'Komponentlar',yields:[{name:'Scrap',amount:24}]},
 {name:'Duct Tape',category:'Komponentlar',yields:[{name:'Cloth',amount:3},{name:'Glue',amount:0.6}]},
 {name:'Empty Propane Tank',category:'Komponentlar',yields:[{name:'Metal Fragments',amount:60}]},
 {name:'CCTV Camera',category:'Komponentlar',yields:[{name:'Tech Trash',amount:0.8},{name:'High Quality Metal',amount:0.8}]},
 {name:'Targeting Computer',category:'Komponentlar',yields:[{name:'Tech Trash',amount:3},{name:'High Quality Metal',amount:0.2},{name:'Metal Fragments',amount:60}]},
 {name:'Timed Explosive Charge (C4)',category:'Qurollar',yields:[{name:'Explosives',amount:12},{name:'Cloth',amount:3},{name:'Tech Trash',amount:1.2}]},
 {name:'Assault Rifle (AK)',category:'Qurollar',yields:[{name:'Wood',amount:120},{name:'High Quality Metal',amount:30},{name:'Metal Spring',amount:2}]},
 {name:'Metal Facemask',category:'Kiyimlar',yields:[{name:'Leather',amount:30},{name:'High Quality Metal',amount:9},{name:'Sewing Kit',amount:3.6}]},
 {name:'Research Table',category:'Qurilish',yields:[{name:'Metal Fragments',amount:120}]},
 {name:'Table',category:'Qurilish',yields:[{name:'Wood',amount:60}]}
]
const recyclerRates = [
 {id:'safe',name:'Safe Zone',label:'Outpost / Bandit',rate:0.4,seconds:8},
 {id:'standard',name:'Oddiy Recycler',label:'Monumentlar · standart',rate:0.5,seconds:5},
 {id:'powered',name:'Quvvatlangan',label:'Power Trip · green',rate:0.6,seconds:4.5},
 {id:'red',name:'Power Plant',label:'Qizil recycler',rate:0.75,seconds:5}
]
type CraftRecipe = {name:string;category:string;workbench:number;seconds:number;ingredients:{name:string;amount:number}[]}
const craftRecipes: CraftRecipe[] = [
 {name:'Timed Explosive Charge (C4)',category:'Portlovchilar',workbench:3,seconds:30,ingredients:[{name:'Explosives',amount:20},{name:'Cloth',amount:5},{name:'Tech Trash',amount:2}]},
 {name:'Assault Rifle (AK)',category:'Qurollar',workbench:3,seconds:45,ingredients:[{name:'Wood',amount:200},{name:'High Quality Metal',amount:50},{name:'Metal Spring',amount:4},{name:'Rifle Body',amount:1}]},
 {name:'Metal Facemask',category:'Kiyimlar',workbench:3,seconds:45,ingredients:[{name:'Leather',amount:50},{name:'High Quality Metal',amount:15},{name:'Sewing Kit',amount:6}]},
 {name:'Satchel Charge',category:'Portlovchilar',workbench:1,seconds:5,ingredients:[{name:'Beancan Grenade',amount:4},{name:'Rope',amount:1},{name:'Small Stash',amount:1}]},
 {name:'Small Stash',category:'Qurilish',workbench:0,seconds:15,ingredients:[{name:'Cloth',amount:10}]},
 {name:'Research Table',category:'Qurilish',workbench:1,seconds:30,ingredients:[{name:'Metal Fragments',amount:200},{name:'Scrap',amount:20}]},
 {name:'Workbench Level 1',category:'Ish stollari',workbench:0,seconds:30,ingredients:[{name:'Wood',amount:500},{name:'Metal Fragments',amount:100}]},
 {name:'Workbench Level 2',category:'Ish stollari',workbench:1,seconds:45,ingredients:[{name:'Metal Fragments',amount:500},{name:'High Quality Metal',amount:20},{name:'Basic Blueprint Fragment',amount:5}]},
 {name:'Table',category:'Qurilish',workbench:0,seconds:30,ingredients:[{name:'Wood',amount:100}]}
]

type LootDrop = { source:string; chance:string; amount:string }
type ItemMeta = { shortname:string; id?:string; stack?:string; despawn?:string; workbench?:string; icon?:string; stats?:{label:string;value:string}[]; research?:string; loot?:LootDrop[]; sourceUrl?:string; recipe?:{name:string;amount:number}[]; output?:string; craftTime?:string; note?:string }
const itemMeta: Record<string,ItemMeta> = {
  'AK-47 (Assault Rifle)': { shortname:'rifle.ak',id:'1545779598',stack:'1',despawn:'1 soat',workbench:'3',icon:'https://files.facepunch.com/rust/item/rifle.ak_512.png',research:'300 Scrap · Tech Tree: 9 Blueprint Book',craftTime:'45 soniya',stats:[{label:'Ko‘krak zarari',value:'50'},{label:'Bosh zarari',value:'100'},{label:'Magazin',value:'30 o‘q'},{label:'Otish tezligi',value:'450 RPM'},{label:'Qayta o‘qlash',value:'4.4 soniya'}],recipe:[{name:'Wood',amount:200},{name:'High Quality Metal',amount:50},{name:'Metal Spring',amount:4},{name:'Rifle Body',amount:1}],loot:[{source:'Locked Crate',chance:'27.78%',amount:'1–2'},{source:'Elite Crate',chance:'3.9%',amount:'1–3'},{source:'Heli Crate',chance:'2.22%',amount:'1'},{source:'Bradley Crate',chance:'0.87%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/assault-rifle',note:'Statistikalar RustHelp sahifasida 2026-yil 4-noyabrda tekshirilgan.'},
  'Timed Explosive Charge': { shortname:'explosive.timed',id:'1248356124',stack:'10',despawn:'1 soat',workbench:'3',icon:'https://files.facepunch.com/rust/item/explosive.timed_512.png',research:'300 Scrap · Tech Tree: 9 Blueprint Book',craftTime:'30 soniya',recipe:[{name:'Explosives',amount:20},{name:'Cloth',amount:5},{name:'Tech Trash',amount:2}],loot:[{source:'Bradley Crate',chance:'36%',amount:'1–2'},{source:'Supply Drop',chance:'26.53%',amount:'1–2'},{source:'Heli Crate',chance:'25%',amount:'2'},{source:'Locked Crate',chance:'9.6%',amount:'1–2'},{source:'Elite Crate',chance:'1.9%',amount:'1–2'}],sourceUrl:'https://rusthelp.com/items/timed-explosive-charge',note:'Loot ehtimollari RustHelp ma’lumotlaridan olingan.'},
  '5.56 Rifle Ammo': { shortname:'ammo.rifle',id:'-1211166256',stack:'128',despawn:'40 daqiqa',workbench:'2',icon:'https://files.facepunch.com/rust/item/ammo.rifle_512.png',research:'100 Scrap · Tech Tree: 17 Blueprint Book',craftTime:'3 soniya (WB2)',stats:[{label:'Asosiy zarar',value:'50'},{label:'Tezlik',value:'375 m/s'},{label:'Masofadagi damage',value:'80% saqlanadi'},{label:'Projectile',value:'1'}],recipe:[{name:'Metal Fragments',amount:10},{name:'Gun Powder',amount:5}],output:'3 dona',loot:[{source:'Cannon Crate',chance:'76%',amount:'12–36'},{source:'Bradley Crate',chance:'19%',amount:'120–240'},{source:'Heli Crate',chance:'15%',amount:'120'},{source:'Elite Crate',chance:'1.22%',amount:'20'}],sourceUrl:'https://rusthelp.com/items/556-rifle-ammo',note:'O‘q statistikasi va loot manbalari RustHelp sahifasida tekshirilgan.'},
  'Medical Syringe': { shortname:'syringe.medical',id:'1079279582',stack:'2',despawn:'20 daqiqa',workbench:'2',icon:'https://files.facepunch.com/rust/item/syringe.medical_512.png',research:'30 Scrap · Tech Tree: 90 Scrap',craftTime:'10 soniya',stats:[{label:'Darhol davolash',value:'+15 HP'},{label:'Vaqt bo‘yicha',value:'+20 HP'},{label:'Radiatsiya',value:'−10'},{label:'Zahar',value:'−5'}],recipe:[{name:'Cloth',amount:15},{name:'Metal Fragments',amount:10},{name:'Low Grade Fuel',amount:10}],loot:[{source:'Heavy Scientist',chance:'88.9%',amount:'1–3'},{source:'Road Scientist',chance:'23.61%',amount:'1–2'},{source:'Cannon Crate',chance:'23.09%',amount:'1–2'},{source:'Medical Crate',chance:'18.18%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/medical-syringe',note:'Davolash ko‘rsatkichlari RustHelp ma’lumotlari asosida.'},
  'Tech Trash': { shortname:'techparts',id:'73681876',stack:'50',despawn:'1 soat',icon:'https://files.facepunch.com/rust/item/techparts_512.png',loot:[{source:'Satellite Crate',chance:'100%',amount:'1–16'},{source:'Treasure Mission Box',chance:'42.13%',amount:'2–9'},{source:'Locked Crate',chance:'39.27%',amount:'2–12'},{source:'Elite Crate',chance:'27.73%',amount:'2–9'},{source:'Supply Drop',chance:'15.97%',amount:'4–8'}],sourceUrl:'https://rusthelp.com/items/tech-trash',note:'Crafting komponenti; 18 ta retseptda ishlatiladi.'},
  'Metal Fragments': { shortname:'metal.fragments',id:'69511070',stack:'1000',despawn:'20 daqiqa',icon:'https://files.facepunch.com/rust/item/metal.fragments_512.png',loot:[{source:'Normal Crate - Cave',chance:'15.39%',amount:'30–49'},{source:'Minecart',chance:'15.39%',amount:'30–49'},{source:'Small Loot Bag',chance:'11.11%',amount:'25–49'}],sourceUrl:'https://rusthelp.com/items/metal-fragments',note:'Metal Ore eritish, recycler va Giant Excavator orqali olinadi.'},
  'Sulfur': { shortname:'sulfur',id:'-1581843485',stack:'1000',despawn:'40 daqiqa',icon:'https://files.facepunch.com/rust/item/sulfur_512.png',sourceUrl:'https://rusthelp.com/items/sulfur',note:'Sulfur Ore eritiladi; Gun Powder va Explosives zanjirining asosiy resursi.'},
  'Low Grade Fuel': { shortname:'lowgradefuel',id:'-946369541',stack:'500',despawn:'5 daqiqa',icon:'https://files.facepunch.com/rust/item/lowgradefuel_512.png',recipe:[{name:'Animal Fat',amount:3},{name:'Cloth',amount:1}],output:'4 dona',craftTime:'5 soniya · Workbench shart emas',loot:[{source:'Underwater Lab Fuel Crate',chance:'100%',amount:'10–18'},{source:'Oil Barrel',chance:'100%',amount:'5–9'}],sourceUrl:'https://rusthelp.com/items/low-grade-fuel',note:'Animal Fat va Cloth dan tayyorlanadi yoki Crude Oil qayta ishlanadi.'},
  'Gun Powder': { shortname:'gunpowder',id:'-265876753',stack:'1000',despawn:'1 soat',workbench:'1',icon:'https://files.facepunch.com/rust/item/gunpowder_512.png',recipe:[{name:'Charcoal',amount:30},{name:'Sulfur',amount:20}],output:'10 dona',craftTime:'2 soniya · WB1',loot:[{source:'Normal Crate - Cave',chance:'7.69%',amount:'15–24'},{source:'Minecart',chance:'7.69%',amount:'15–24'}],sourceUrl:'https://rusthelp.com/items/gun-powder',note:'Gun Powder portlovchi va o‘q-dori crafting zanjirida ishlatiladi.'},
  'Explosives': { shortname:'explosives',id:'-592016202',stack:'100',despawn:'1 soat',workbench:'3',icon:'https://files.facepunch.com/rust/item/explosives_512.png',recipe:[{name:'Gun Powder',amount:50},{name:'Low Grade Fuel',amount:3},{name:'Sulfur',amount:10},{name:'Metal Fragments',amount:10}],output:'1 dona',craftTime:'5 soniya · WB3',loot:[{source:'Scientist RHIB Drybox',chance:'12.11%',amount:'1–2'},{source:'Locked Crate',chance:'5.56%',amount:'1'},{source:'Elite Crate',chance:'1.9%',amount:'1–2'},{source:'Heli Crate',chance:'0.66%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/explosives',note:'C4 va Rocket crafting uchun komponent.'},
  'Charcoal': { shortname:'charcoal',id:'-1938052175',stack:'1000',despawn:'5 daqiqa',icon:'https://files.facepunch.com/rust/item/charcoal_512.png',sourceUrl:'https://rusthelp.com/items/charcoal',note:'Campfire va Furnace yonish jarayonining qo‘shimcha mahsuloti.'},
  'Animal Fat': { shortname:'fat.animal',id:'-1018587433',stack:'1000',icon:'https://files.facepunch.com/rust/item/fat.animal_512.png',sourceUrl:'https://rusthelp.com/items/animal-fat',note:'Hayvonlardan olinadi; Low Grade Fuel retseptida ishlatiladi.'},
  'Cloth': { shortname:'cloth',id:'-858312878',stack:'1000',icon:'https://files.facepunch.com/rust/item/cloth_512.png',sourceUrl:'https://rusthelp.com/items/cloth',note:'O‘simlik tolasi, hemp va ayrim loot manbalaridan olinadi.'},
  'Rocket Launcher': {shortname:'rocket.launcher',id:'442886268',stack:'1',despawn:'1 soat',workbench:'2',icon:'https://files.facepunch.com/rust/item/rocket.launcher_512.png',research:'120 Scrap · Tech Tree: Workbench 2',craftTime:'25 soniya · WB2 (12 soniya · WB3)',recipe:[{name:'High Quality Metal',amount:40},{name:'Metal Pipe',amount:4}],loot:[{source:'Locked Crate',chance:'7.32%',amount:'1–3'},{source:'Elite Crate',chance:'0.78%',amount:'1–3'},{source:'Military Crate',chance:'0.42%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/rocket-launcher',note:'Crafting, loot va identifikatorlar RustHelp ma’lumotidan; Facepunch item sahifasi bilan solishtirilgan.'},
  'Rocket': {shortname:'ammo.rocket.basic',id:'-742865266',stack:'3',despawn:'1 soat',workbench:'3',icon:'https://files.facepunch.com/rust/item/ammo.rocket.basic_512.png',research:'100 Scrap · Workbench 3 Tech Tree',craftTime:'5 soniya',recipe:[{name:'Metal Pipe',amount:2},{name:'Gun Powder',amount:150},{name:'Explosives',amount:10}],loot:[{source:'Heli Crate',chance:'25%',amount:'3'},{source:'Locked Crate',chance:'5.56%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/rocket',note:'Crafting va loot jadvali RustHelp ma’lumotidan; server sozlamalari natijani o‘zgartirishi mumkin.'},
  'High Velocity Rocket': {shortname:'ammo.rocket.hv',id:'-1841918730',stack:'3',despawn:'1 soat',workbench:'2',icon:'https://files.facepunch.com/rust/item/ammo.rocket.hv_512.png',research:'60 Scrap · Workbench 2 Tech Tree',craftTime:'5 soniya',recipe:[{name:'Metal Pipe',amount:1},{name:'Gun Powder',amount:100}],sourceUrl:'https://rusthelp.com/items/high-velocity-rocket',note:'Craft retsepti, stack size va Workbench darajasi RustHelp sahifasida ko‘rsatilgan.'},
  'Incendiary Rocket': {shortname:'ammo.rocket.fire',id:'1638322904',stack:'3',despawn:'1 soat',workbench:'2',icon:'https://files.facepunch.com/rust/item/ammo.rocket.fire_512.png',research:'60 Scrap · Workbench 2 Tech Tree',craftTime:'5 soniya',recipe:[{name:'Metal Pipe',amount:2},{name:'Gun Powder',amount:150},{name:'Low Grade Fuel',amount:75}],loot:[{source:'Bradley Crate',chance:'19%',amount:'5–10'},{source:'Heli Crate',chance:'15%',amount:'5'},{source:'Large Loot Bag',chance:'16.67%',amount:'5'}],sourceUrl:'https://rusthelp.com/items/incendiary-rocket',note:'Crafting va loot qiymatlari RustHelp ma’lumotidan.'},
  'Satchel Charge': {shortname:'explosive.satchel',id:'-1878475007',stack:'10',despawn:'40 daqiqa',workbench:'1',icon:'https://files.facepunch.com/rust/item/explosive.satchel_512.png',research:'100 Scrap · Workbench 1 Tech Tree',craftTime:'5 soniya',recipe:[{name:'Beancan Grenade',amount:4},{name:'Rope',amount:1},{name:'Small Stash',amount:1}],loot:[{source:'Supply Drop',chance:'48.98%',amount:'2–4'},{source:'Locked Crate',chance:'8.57%',amount:'2'},{source:'Underwater Advanced Crate',chance:'1.11%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/satchel-charge',note:'Crafting va loot jadvali 2026-yil 4-noyabrda tekshirilgan RustHelp sahifasidan.'},
  'Beancan Grenade': {shortname:'grenade.beancan',stack:'5',despawn:'40 daqiqa',workbench:'1',icon:'https://files.facepunch.com/rust/item/grenade.beancan_512.png',research:'30 Scrap · Workbench 1 Tech Tree',craftTime:'3 soniya',recipe:[{name:'Gun Powder',amount:60},{name:'Metal Fragments',amount:20}],loot:[{source:'Elite Crate',chance:'6.5%',amount:'2'},{source:'Heavy Scientist',chance:'5%',amount:'2'}],sourceUrl:'https://rusthelp.com/items/beancan-grenade',note:'Beancan retsepti va loot manbalari RustHelp ma’lumotidan.'},
  'Metal Facemask': {shortname:'metal.facemask',id:'-194953424',stack:'1',despawn:'1 soat',workbench:'3',icon:'https://files.facepunch.com/rust/item/metal.facemask_512.png',research:'120 Scrap · Workbench 3 Tech Tree',craftTime:'35 soniya',recipe:[{name:'Leather',amount:50},{name:'High Quality Metal',amount:15},{name:'Sewing Kit',amount:6}],loot:[{source:'Locked Crate',chance:'52.78%',amount:'1–2'},{source:'Elite Crate',chance:'1.9%',amount:'1–2'},{source:'Heli Crate',chance:'0.66%',amount:'1'}],sourceUrl:'https://rusthelp.com/items/metal-facemask',note:'Statistika, crafting va loot jadvali RustHelp ma’lumotidan.'},
  'Small Stash': {shortname:'stash.small',stack:'1',despawn:'20 daqiqa',icon:'https://files.facepunch.com/rust/item/stash.small_512.png',craftTime:'15 soniya · Workbench talab qilinmaydi',recipe:[{name:'Cloth',amount:10}],sourceUrl:'https://rusthelp.com/items/small-stash',note:'6 slotli yashirin konteyner; Satchel Charge retseptida ham ishlatiladi.'},
}
const itemShortnames: Record<string,string> = {
  'AK-47 (Assault Rifle)':'rifle.ak','Assault Rifle':'rifle.ak','LR-300 Assault Rifle':'rifle.lr300','MP5A4':'smg.mp5','Thompson':'smg.thompson','Custom SMG':'smg.2','Semi-Automatic Rifle':'rifle.semiauto','Bolt Action Rifle':'rifle.bolt','Python Revolver':'pistol.python','Revolver':'pistol.revolver','Pump Shotgun':'shotgun.pump','Double Barrel Shotgun':'shotgun.double','M249':'lmg.m249','Metal Fragments':'metal.fragments','Timed Explosive Charge':'explosive.timed','Large Medkit':'largemedkit','Armored Door':'door.hinged.toptier','Tech Trash':'techparts','Road Sign Jacket':'roadsign.jacket','5.56 Rifle Ammo':'ammo.rifle','Wood':'wood','Stone':'stones','Sulfur':'sulfur','Metal Ore':'metal.ore','High Quality Metal':'metal.refined','Cloth':'cloth','Scrap':'scrap','Rifle Body':'riflebody','SMG Body':'smgbody','Metal Spring':'metalspring','Sewing Kit':'sewingkit','Road Signs':'roadsigns','Pistol Bullet':'ammo.pistol','12 Gauge Buckshot':'ammo.shotgun','HV 5.56 Rifle Ammo':'ammo.rifle.hv','Medical Syringe':'syringe.medical','Bandage':'bandage','Coffee Can Helmet':'coffeecan.helmet','Metal Chest Plate':'metal.plate.torso','Hoodie':'hoodie','Garage Door':'wall.frame.garagedoor','High External Stone Wall':'gates.external.high.stone','Auto Turret':'autoturret','Flame Turret':'flameturret','Explosives':'explosives','Low Grade Fuel':'lowgradefuel','Animal Fat':'fat.animal','Leather':'leather','Gun Powder':'gunpowder','Charcoal':'charcoal',
  'Rocket Launcher':'rocket.launcher','Rocket':'ammo.rocket.basic','High Velocity Rocket':'ammo.rocket.hv','Incendiary Rocket':'ammo.rocket.fire',
  'Satchel Charge':'explosive.satchel','Beancan Grenade':'grenade.beancan','F1 Grenade':'grenade.f1',
  'Metal Facemask':'metal.facemask','Road Sign Kilt':'roadsign.kilt','Hazmat Suit':'hazmatsuit','Tactical Gloves':'tactical.gloves','Boots':'shoes.boots',
  'Hatchet':'hatchet','Pickaxe':'pickaxe','Stone Pickaxe':'stone.pickaxe','Jackhammer':'jackhammer','Chainsaw':'chainsaw',
  'Sleeping Bag':'sleepingbag','Tool Cupboard':'cupboard.tool','Code Lock':'lock.code','Key Lock':'lock.key','Large Wooden Box':'box.wooden.large',
  'Furnace':'furnace','Large Furnace':'furnace.large','Research Table':'research.table','Workbench Level 1':'workbench1','Workbench Level 2':'workbench2','Workbench Level 3':'workbench3',
  'Shotgun Trap':'guntrap','Wind Turbine':'windmill','Solar Panel':'solar.panels','Small Rechargeable Battery':'battery.small','Large Rechargeable Battery':'battery.large','Electrical Branch':'electric.branch',
  'CCTV Camera':'cctv.camera','RF Receiver':'rf.receiver','Water Purifier':'water.purifier','Corn':'corn','Pumpkin':'pumpkin','Mushroom':'mushroom','Cooked Wolf Meat':'wolfmeat.cooked','Water Jug':'waterjug',
  'Metal Pipe':'metalpipe','Gears':'gears','Rope':'rope','Small Stash':'stash.small','Stones':'stones'
}
const itemIconUrl = (name:string) => itemMeta[name]?.icon || (itemShortnames[name] ? `https://files.facepunch.com/rust/item/${itemShortnames[name]}_512.png` : '')
const chainRecipes: Record<string,{amount:number;name:string;output?:number}[]> = {
  'AK-47 (Assault Rifle)':[{name:'Wood',amount:200},{name:'High Quality Metal',amount:50},{name:'Metal Spring',amount:4},{name:'Rifle Body',amount:1}],
  'Timed Explosive Charge':[{name:'Explosives',amount:20},{name:'Cloth',amount:5},{name:'Tech Trash',amount:2}],
  'Explosives':[{name:'Gun Powder',amount:50},{name:'Low Grade Fuel',amount:3},{name:'Sulfur',amount:10},{name:'Metal Fragments',amount:10}],
  'Gun Powder':[{name:'Charcoal',amount:30},{name:'Sulfur',amount:20}],
  'Low Grade Fuel':[{name:'Animal Fat',amount:3},{name:'Cloth',amount:1}],
  '5.56 Rifle Ammo':[{name:'Metal Fragments',amount:10},{name:'Gun Powder',amount:5}],
  'Medical Syringe':[{name:'Cloth',amount:15},{name:'Metal Fragments',amount:10},{name:'Low Grade Fuel',amount:10}],
  'Rocket':[{name:'Metal Pipe',amount:2},{name:'Gun Powder',amount:150},{name:'Explosives',amount:10}],
  'High Velocity Rocket':[{name:'Metal Pipe',amount:1},{name:'Gun Powder',amount:100}],
  'Incendiary Rocket':[{name:'Metal Pipe',amount:2},{name:'Gun Powder',amount:150},{name:'Low Grade Fuel',amount:75}],
  'Satchel Charge':[{name:'Beancan Grenade',amount:4},{name:'Rope',amount:1},{name:'Small Stash',amount:1}],
  'Beancan Grenade':[{name:'Gun Powder',amount:60},{name:'Metal Fragments',amount:20}],
  'F1 Grenade':[{name:'Metal Fragments',amount:30},{name:'Gun Powder',amount:50}],
  'Rocket Launcher':[{name:'High Quality Metal',amount:40},{name:'Metal Pipe',amount:4}],
  'Metal Facemask':[{name:'Leather',amount:50},{name:'High Quality Metal',amount:15},{name:'Sewing Kit',amount:6}],
  'Road Sign Kilt':[{name:'Leather',amount:10},{name:'Sewing Kit',amount:1},{name:'Road Signs',amount:2}],
  'Code Lock':[{name:'Metal Fragments',amount:100}],
  'Sleeping Bag':[{name:'Cloth',amount:30}],
  'Tool Cupboard':[{name:'Wood',amount:1000}],
  'Large Wooden Box':[{name:'Wood',amount:250}],
  'Furnace':[{name:'Stones',amount:200},{name:'Wood',amount:100},{name:'Low Grade Fuel',amount:50}],
  'Research Table':[{name:'Metal Fragments',amount:200},{name:'Scrap',amount:20}],
  'Small Stash':[{name:'Cloth',amount:10}],
}
const recipeOutput: Record<string,number> = {'Gun Powder':10,'Low Grade Fuel':4,'5.56 Rifle Ammo':3,'Explosives':1,'Timed Explosive Charge':1,'Medical Syringe':1,'AK-47 (Assault Rifle)':1,'Rocket':1,'High Velocity Rocket':1,'Incendiary Rocket':1,'Satchel Charge':1,'Beancan Grenade':1,'F1 Grenade':1,'Rocket Launcher':1,'Metal Facemask':1,'Road Sign Kilt':1,'Code Lock':1,'Sleeping Bag':1,'Tool Cupboard':1,'Large Wooden Box':1,'Furnace':1,'Research Table':1,'Small Stash':1}

const format = (n: number) => new Intl.NumberFormat('uz-UZ').format(n)
const getTarget = (id: string, source: Target[] = targets) => source.find(t => t.id === id) ?? source[0]

function CraftTreeNode({name,amount,depth=0}:{name:string;amount:number;depth?:number}) {
  const ingredients=chainRecipes[name]
  const output=recipeOutput[name] || 1
  const batches=ingredients ? Math.ceil(amount/output) : 0
  return <div className="craft-tree-node" style={{marginLeft:depth*13}}>
    <div className="craft-tree-item"><span>{itemIconUrl(name)?<img src={itemIconUrl(name)} alt="" loading="lazy"/>:<Package size={15}/>}<b>{name}</b></span><strong>×{amount}</strong></div>
    {ingredients && <div className="craft-tree-children">{ingredients.map((ingredient,i)=><CraftTreeNode key={`${name}-${ingredient.name}-${i}`} name={ingredient.name} amount={ingredient.amount*batches} depth={depth+1}/>)}</div>}
  </div>
}

const airfieldMapPointTitles: Record<string,string> = { terminal:'Terminal / ATC', hangars:'Hangarlar', tunnel:'Yerosti tunnel kirishi', helipad:'Helipad / Chinook zonasi', recycler:'Recycler nuqtalari' }
const airfieldMapPointDescriptions: Record<string,string> = { terminal:'Puzzle yo‘lining boshlanish nuqtasi. Birinchi fuse box va timer switch shu bino ichida joylashgan.', hangars:'Uchta yirik angar va ochiq maydon. Loot qidirishda burchaklarni tekshiring, ochiq runway bo‘ylab ehtiyot bo‘ling.', tunnel:'Yerosti tunneliga kirish. Green va Blue card yo‘nalishi shu tomondan davom etadi.', helipad:'Helipad va CCTV kuzatuv nuqtasi. Atrof ochiq bo‘lgani uchun uzoq masofadan ko‘rinishingiz mumkin.', recycler:'Airfield hududida ikkita recycler mavjud. Ularning aniq joylashuvi server map seediga qarab biroz farq qilishi mumkin.' }


type PublicAd = { id: string; title: string; image_url: string; target_url: string; placement: string }
function AdSlot({ placement }: { placement: 'home_top' | 'wiki_inline' | 'footer' }) {
  const [ad, setAd] = useState<PublicAd | null>(null)
  useEffect(() => {
    let active = true
    async function load() {
      if (!supabase) return
      const now = new Date().toISOString()
      const { data } = await supabase.from('advertisements').select('id,title,image_url,target_url,placement,starts_at,ends_at')
        .eq('placement', placement).eq('is_active', true).limit(20)
      const current = Date.now()
      const selected = (data || []).find((item: any) => (!item.starts_at || new Date(item.starts_at).getTime() <= current) && (!item.ends_at || new Date(item.ends_at).getTime() >= current))
      if (active && selected) {
        setAd(selected as PublicAd)
        void supabase.rpc('record_ad_impression', { ad_id: selected.id })
      }
    }
    void load()
    return () => { active = false }
  }, [placement])
  if (!ad) return null
  return <div className={`public-ad-slot public-ad-${placement}`}><span className="public-ad-label">HAMKORLIK / REKLAMA</span><a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => { void supabase?.rpc('record_ad_click', { ad_id: ad.id }) }}><img src={ad.image_url} alt={ad.title} loading="lazy" decoding="async"/><span className="sr-only">{ad.title}</span></a></div>
}

export default function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/admin') return <AdminAuth />
  const [tab, setTab] = useState<Tab>('wiki')
  const [publishedRows, setPublishedRows] = useState<any[]>([])
  const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(defaultSiteSettings)
  const [gameData, setGameData] = useState<any>({
    targets, methods, recycleItems, recyclerRates, craftRecipes
  })
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Barchasi')
  const [craftableOnly, setCraftableOnly] = useState(false)
  const [itemSort, setItemSort] = useState('name')
  const [wikiSection, setWikiSection] = useState<WikiSection>('items')
  const [wikiDetail, setWikiDetail] = useState<WikiDetail>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [raidLines, setRaidLines] = useState<RaidLine[]>([{ id:1, targetId:'stone-wall', quantity:1 }])
  const [nextLine, setNextLine] = useState(2)
  const [raidMethod, setRaidMethod] = useState<RaidMethod | 'cheapest'>('cheapest')
  const [monumentQuery, setMonumentQuery] = useState('')
  const [monumentType, setMonumentType] = useState('Barchasi')
  const [selectedMonument, setSelectedMonument] = useState('Outpost')
  const [airfieldMapMode, setAirfieldMapMode] = useState<'real'|'schematic'|'puzzle'>('real')
  const [airfieldMapPoint, setAirfieldMapPoint] = useState('terminal')
  const [recycleRate, setRecycleRate] = useState('standard')
  const [recycleQuantities, setRecycleQuantities] = useState<Record<string,number>>({})
  const [recycleSearch, setRecycleSearch] = useState('')
  const [craftSearch, setCraftSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(craftRecipes[0].name)
  const [craftQuantity, setCraftQuantity] = useState(1)
  const [weaponSearch, setWeaponSearch] = useState('')
  const [weaponType, setWeaponType] = useState('Barchasi')
  const [blueprintSearch, setBlueprintSearch] = useState('')
  const [blueprintGroup, setBlueprintGroup] = useState('Barchasi')

  useEffect(() => {
    let active = true
    async function loadPublicSiteSettings() {
      if (!supabase) return
      const { data, error } = await supabase.from('site_settings').select('key,value')
      if (error || !data || !active) return
      const values: Record<string, string> = {}
      data.forEach((row: any) => {
        const value = row.value
        values[row.key] = typeof value === 'string' ? value : value == null ? '' : String(value)
      })
      setSiteSettings({
        site_name: values.site_name || defaultSiteSettings.site_name,
        site_description: values.site_description || defaultSiteSettings.site_description,
        site_logo_url: values.site_logo_url || '',
        contact_email: values.contact_email || '',
        seo_title: values.seo_title || defaultSiteSettings.seo_title,
        seo_description: values.seo_description || defaultSiteSettings.seo_description
      })
    }
    void loadPublicSiteSettings()
    return () => { active = false }
  }, [])

  useEffect(() => {
    document.title = siteSettings.seo_title || siteSettings.site_name || defaultSiteSettings.seo_title
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = siteSettings.seo_description || defaultSiteSettings.seo_description
  }, [siteSettings])

  useEffect(() => {
    let active = true
    async function loadPublishedCatalog() {
      if (!supabase) return
      const { data } = await supabase.from('content_entries')
        .select('title,content_type,category,description,body,status')
        .eq('status', 'published')
        .in('content_type', ['item', 'weapon', 'monument'])
      if (active && data) setPublishedRows(data)
    }
    void loadPublishedCatalog()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadGameData() {
      if (!supabase) return
      const { data, error } = await supabase.from('game_data').select('data_key,value')
      if (!error && active && data?.length) {
        const next: any = { targets, methods, recycleItems, recyclerRates, craftRecipes }
        data.forEach((row: any) => {
          const map: Record<string,string> = {
            raid_targets: 'targets', raid_methods: 'methods',
            recycler_items: 'recycleItems', recycler_rates: 'recyclerRates',
            craft_recipes: 'craftRecipes'
          }
          const key = map[row.data_key]
          if (key && Array.isArray(row.value) && row.value.length) next[key] = row.value
        })
        setGameData(next)
      }
    }
    void loadGameData()
    return () => { active = false }
  }, [])

  const raidTargets = (gameData.targets?.length ? gameData.targets : targets) as Target[]
  const raidMethods = (gameData.methods?.length ? gameData.methods : methods) as {id: RaidMethod; label:string; short:string; sulfur:number}[]
  const managedRecycleItems = (gameData.recycleItems?.length ? gameData.recycleItems : recycleItems) as RecycleItem[]
  const managedRecyclerRates = (gameData.recyclerRates?.length ? gameData.recyclerRates : recyclerRates) as {id:string;name:string;label:string;rate:number;seconds:number}[]
  const managedCraftRecipes = (gameData.craftRecipes?.length ? gameData.craftRecipes : craftRecipes) as CraftRecipe[]
  const catalogItems: any[] = [...items]
  const catalogMonuments: any[] = [...monuments]
  publishedRows.forEach(row => {
    const body = row.body && typeof row.body === 'object' ? row.body : {}
    if (row.content_type === 'monument') {
      const next = {
        ...body, name: row.title, type: row.category || body.type || 'Monument',
        desc: row.description || body.desc || '', size: body.size || '—',
        tips: Array.isArray(body.tips) ? body.tips : [],
        loot: body.loot || row.description || 'Ma’lumot tez orada qo‘shiladi.',
        color: body.color || 'orange'
      }
      // body.name keeps the original catalog identity even if an admin renames the entry.
      // Use it to replace the legacy catalog record instead of appending a duplicate.
      const originalName = typeof body.name === 'string' ? body.name : row.title
      const index = catalogMonuments.findIndex(x => x.name === originalName || x.name === row.title)
      if (index >= 0) catalogMonuments[index] = { ...catalogMonuments[index], ...next }
      else catalogMonuments.push(next)
    } else {
      const next = {
        ...body, name: row.title, image_url: typeof body.image_url === 'string' ? body.image_url : '', category: row.category || body.category || '',
        description: row.description || body.description || '', icon: body.icon || '📦',
        note: body.note || 'OUTPOST UZ kontenti'
      }
      // Preserve the imported item's original identity for matching after title edits.
      const originalName = typeof body.name === 'string' ? body.name : row.title
      const index = catalogItems.findIndex(x => x.name === originalName || x.name === row.title)
      if (index >= 0) catalogItems[index] = { ...catalogItems[index], ...next }
      else catalogItems.push(next)
    }
  })

  const filteredItems = useMemo(() => Array.from(new Map(catalogItems.map(item=>[item.name,item])).values()).filter(item =>
    (activeCategory === 'Barchasi' || item.category === activeCategory) &&
    (!craftableOnly || Boolean(itemMeta[item.name]?.recipe || chainRecipes[item.name] || managedCraftRecipes.some(r=>r.name===item.name))) &&
    `${item.name} ${item.description} ${itemShortnames[item.name] || ''}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a,b)=>itemSort==='category' ? a.category.localeCompare(b.category)||a.name.localeCompare(b.name) : a.name.localeCompare(b.name)), [activeCategory, query, craftableOnly, itemSort, publishedRows])
  const filteredMonuments = useMemo(() => catalogMonuments.filter(m =>
    (monumentType === 'Barchasi' || m.type === monumentType) &&
    `${m.name} ${m.type} ${m.desc}`.toLowerCase().includes(monumentQuery.toLowerCase())
  ), [monumentQuery, monumentType, publishedRows])

  const totals = useMemo(() => raidMethods.map(method => {
    const units = raidLines.reduce((sum, line) => sum + getTarget(line.targetId, raidTargets)[method.id] * Math.max(0, line.quantity), 0)
    return { ...method, units, sulfur: units * method.sulfur }
  }), [raidLines, raidMethods, raidTargets])
  const cheapest = [...totals].filter(x => x.units > 0).sort((a,b) => a.sulfur - b.sulfur)[0]
  const selectedTotal = raidMethod === 'cheapest' ? cheapest : totals.find(x => x.id === raidMethod)
  const totalTargets = raidLines.reduce((sum, line) => sum + Math.max(0, line.quantity), 0)

  const addRaidLine = () => { setRaidLines(lines => [...lines, { id:nextLine, targetId:'stone-wall', quantity:1 }]); setNextLine(n => n+1) }
  const updateLine = (id:number, patch:Partial<RaidLine>) => setRaidLines(lines => lines.map(line => line.id === id ? {...line, ...patch} : line))
  const removeLine = (id:number) => setRaidLines(lines => lines.length > 1 ? lines.filter(line => line.id !== id) : [{id:nextLine, targetId:'stone-wall', quantity:1}])
  const activeRecycler = managedRecyclerRates.find(r=>r.id===recycleRate) ?? managedRecyclerRates[1]
  const recycleTotals = useMemo(() => {
    const totals: Record<string,number> = {}
    managedRecycleItems.forEach(item => {
      const qty = Math.max(0,recycleQuantities[item.name] ?? 0)
      if (!qty) return
      item.yields.forEach(y => { totals[y.name] = (totals[y.name] ?? 0) + y.amount * qty * (activeRecycler.rate / 0.5) })
    })
    return (Object.entries(totals) as [string,number][]).sort((a,b)=>a[0].localeCompare(b[0]))
  }, [recycleQuantities, activeRecycler, managedRecycleItems])
  const recycleInputCount = Object.keys(recycleQuantities).reduce((sum,key)=>sum+Math.max(0,recycleQuantities[key] ?? 0),0)
  const filteredRecycleItems = managedRecycleItems.filter(i=>`${i.name} ${i.category}`.toLowerCase().includes(recycleSearch.toLowerCase()))
  const filteredCraftRecipes = managedCraftRecipes.filter(r=>`${r.name} ${r.category}`.toLowerCase().includes(craftSearch.toLowerCase()))
  const recipe = managedCraftRecipes.find(r=>r.name===selectedRecipe) ?? managedCraftRecipes[0]
  const filteredWeapons = weaponProfiles.filter(w=>(weaponType==='Barchasi'||w.type===weaponType) && `${w.name} ${w.type} ${w.ammo} ${w.role}`.toLowerCase().includes(weaponSearch.toLowerCase()))
  const weaponTypes = ['Barchasi', ...Array.from(new Set(weaponProfiles.map(w=>w.type)))]
  const filteredBlueprints = blueprintGuides.filter(b=>(blueprintGroup==='Barchasi'||b.group===blueprintGroup) && `${b.name} ${b.group} ${b.cost} ${b.level}`.toLowerCase().includes(blueprintSearch.toLowerCase()))
  const blueprintGroups = ['Barchasi', ...Array.from(new Set(blueprintGuides.map(b=>b.group)))]

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => setTab('wiki')}><span className="brand-mark">{siteSettings.site_logo_url ? <img src={siteSettings.site_logo_url} alt="" onError={e=>{e.currentTarget.style.display="none"}}/> : "O"}</span><span>{siteSettings.site_name.replace(/\s+UZ$/i, "")}<span className="brand-muted"> {siteSettings.site_name.toUpperCase().endsWith("UZ") ? "UZ" : ""}</span><small>RUST WIKI · O‘ZBEKCHA</small></span></a>
      <nav className={mobileMenu ? 'nav nav-open' : 'nav'}>
        <button className={tab==='wiki'?'nav-active':''} onClick={() => {setTab('wiki');setMobileMenu(false)}}>Wiki</button>
        <button className={tab==='raid'?'nav-active':''} onClick={() => {setTab('raid');setMobileMenu(false)}}>Raid kalkulyatori</button>
        <button className={tab==='monuments'?'nav-active':''} onClick={() => {setTab('monuments');setMobileMenu(false)}}>Monumentlar</button>
        <button className={tab==='recycler'?'nav-active':''} onClick={() => {setTab('recycler');setMobileMenu(false)}}>Recycler</button>
        <button className={tab==='craft'?'nav-active':''} onClick={() => {setTab('craft');setMobileMenu(false)}}>Craft</button>
      </nav>
      <div className="top-actions"><span className="language">UZ <ChevronDown size={13}/></span><button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menyuni ochish">{mobileMenu ? <X/> : <Menu/>}</button></div>
    </header>

    {tab === 'wiki' && <main id="top">
      <section className="hero">
        <div className="hero-grid"></div><div className="hero-content">
          <div className="eyebrow"><span className="pulse"></span> RUST O‘YINCHILARI UCHUN O‘ZBEKCHA ENSIKLOPEDIYA</div>
          <h1>Omon qolish<br/>uchun <em>hamma</em> narsa.</h1>
          <p>{siteSettings.site_description}</p>
          <div className="search-wrap"><Search size={20}/><input value={query} onChange={e => {setQuery(e.target.value); setActiveCategory('Barchasi')}} placeholder="Buyum, qurol yoki resursni qidiring..."/><kbd>CTRL K</kbd></div>
          <div className="hero-meta"><span><i></i> Buyumlar ensiklopediyasi</span><span><i></i> Ishlaydigan raid kalkulyatori</span><span><i></i> Monument qo‘llanmalari</span></div>
        </div>
        <div className="hero-art"><div className="art-ring ring-one"></div><div className="art-ring ring-two"></div><div className="art-cross">✳</div><div className="art-label label-top">SURVIVE / BUILD / DOMINATE</div><div className="art-number">01<span> / 03</span></div></div>
        <div className="hero-bottom"><span>{siteSettings.site_name} — MA’LUMOTLAR BAZASI</span><span>PASTGA TUSHING ↓</span></div>
      </section>
      <section className="stats-strip"><div><strong>{catalogMonuments.length}<span></span></strong><small>MONUMENT MA’LUMOTI</small></div><div><strong>{raidTargets.length}</strong><small>RAID NISHONI</small></div><div><strong>{new Set(catalogItems.map(item=>item.name)).size}</strong><small>ITEM KATALOGI</small></div><div className="stats-note">Ma’lumotlar manbasi va yangilanish sanasi ko‘rsatiladi.</div></section>
      <AdSlot placement="home_top" />
      <AdSlot placement="wiki_inline" />
      <section className="section wiki-section" id="wiki">
        <div className="section-heading"><div><div className="section-kicker">01 / BUYUMLAR ENSIKLOPEDIYASI</div><h2>Rust olamini <em>o‘rganing.</em></h2><p>Resurslar, komponentlar, qurollar, kiyimlar, tibbiyot va qurilish buyumlari katalogi.</p></div><span className="text-link">OUTPOST UZ <ArrowUpRight size={16}/></span></div>
        <div className="wiki-subnav" role="tablist" aria-label="Wiki bo‘limlari">
          <button className={wikiSection==='items'?'selected':''} onClick={()=>setWikiSection('items')}><Boxes size={15}/> Buyumlar</button>
          <button className={wikiSection==='weapons'?'selected':''} onClick={()=>setWikiSection('weapons')}><Crosshair size={15}/> Qurollar</button>
          <button className={wikiSection==='blueprints'?'selected':''} onClick={()=>setWikiSection('blueprints')}><BookOpen size={15}/> Blueprints</button>
        </div>
        {wikiSection === 'items' && <>
          <div className="category-layout"><aside className="category-list"><div className="category-title">KATEGORIYALAR <span>{categories.length}</span></div>{categories.map(cat => {const Icon = cat.icon; return <button key={cat.name} className={activeCategory === cat.name ? 'category active' : 'category'} onClick={() => setActiveCategory(cat.name)}><Icon size={17}/><span>{cat.name}</span></button>})}</aside>
            <div className="items-panel"><div className="items-head"><div><h3>{activeCategory === 'Barchasi' ? 'Buyumlar katalogi' : activeCategory}</h3><span>{filteredItems.length} ta natija · shortname bo‘yicha ham qidirish mumkin</span></div><div className="catalog-controls"><label className="craftable-toggle"><input type="checkbox" checked={craftableOnly} onChange={e=>setCraftableOnly(e.target.checked)}/> Craft qilinadiganlar</label><select value={itemSort} onChange={e=>setItemSort(e.target.value)} aria-label="Saralash"><option value="name">A–Z</option><option value="category">Kategoriya</option></select></div></div><div className="item-grid">{filteredItems.map(item => <article className="item-card clickable-card" key={item.name} role="button" tabIndex={0} onClick={() => setWikiDetail({kind:'item',name:item.name})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setWikiDetail({kind:'item',name:item.name})}}}><div className="item-icon">{(item.image_url || itemIconUrl(item.name)) ? <img src={(item.image_url || itemIconUrl(item.name))} alt={item.name} loading="lazy" onError={e=>{e.currentTarget.style.display="none"}}/> : item.icon}</div><div className="item-info"><small>{item.category}</small><h4>{item.name}</h4><p>{item.description}</p><span className="item-rarity">{item.note}</span></div><ArrowUpRight className="item-arrow" size={16}/></article>)}{filteredItems.length === 0 && <div className="empty-state">Hech narsa topilmadi. Boshqa nom bilan qidirib ko‘ring.</div>}</div><div className="demo-note">v0.8 katalogi kengaytirildi. Har bir itemda ma’lumot darajasi va manba ko‘rsatiladi; tekshirilmagan qiymatlar taxmin sifatida berilmaydi.</div></div>
          </div>
        </>}
        {wikiSection === 'weapons' && <>
          <div className="page-intro wiki-inner-intro"><h1>Qurollar <em>arsenali.</em></h1><p>Rust qurollari, o‘q-dori turlari, jang masofasi va foydalanish uslubi bo‘yicha o‘zbekcha katalog.</p></div>
          <div className="monument-tools"><div className="search-wrap monument-search"><Search size={18}/><input value={weaponSearch} onChange={e=>setWeaponSearch(e.target.value)} placeholder="Qurol nomi yoki o‘q-dori qidirish..."/></div><div className="filter-chips">{weaponTypes.map(t=><button key={t} className={weaponType===t?'selected':''} onClick={()=>setWeaponType(t)}>{t}</button>)}</div></div>
          <div className="weapon-grid">{filteredWeapons.map(w=><article className="panel weapon-card clickable-card" key={w.name} role="button" tabIndex={0} onClick={()=>setWikiDetail({kind:'weapon',name:w.name})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setWikiDetail({kind:'weapon',name:w.name})}}}><div className="weapon-card-top"><span className="weapon-icon">{itemIconUrl(w.name.startsWith("Assault Rifle") ? "AK-47 (Assault Rifle)" : w.name) ? <img src={itemIconUrl(w.name.startsWith("Assault Rifle") ? "AK-47 (Assault Rifle)" : w.name)} alt={w.name} loading="lazy" onError={e=>{e.currentTarget.style.display="none"}}/> : w.icon}</span><span className="workbench-badge">{w.tier}</span></div><span className="panel-kicker">{w.type}</span><h2>{w.name}</h2><p>{w.desc}</p><div className="weapon-meta"><div><small>O‘Q-DORI</small><b>{w.ammo}</b></div><div><small>JANG USLUBI</small><b>{w.role}</b></div><div><small>OLISH USULI</small><b>{w.craft}</b></div></div></article>)}{filteredWeapons.length===0&&<div className="empty-state">Qurol topilmadi.</div>}</div>
          <div className="source-note"><Info size={15}/><span>Bu sahifada hozircha qurollarning umumiy qo‘llanilishi berilgan. Damage, recoil va boshqa raqamli parametrlar server/o‘yin versiyasi bo‘yicha alohida tekshirilgach qo‘shiladi.</span></div>
        </>}
        {wikiSection === 'blueprints' && <>
          <div className="page-intro wiki-inner-intro"><h1>Blueprint <em>qo‘llanmasi.</em></h1><p>Buyumlarni ochish, research qilish va tayyorlash uchun kerakli materiallar hamda Workbench darajasi.</p></div>
          <div className="monument-tools"><div className="search-wrap monument-search"><Search size={18}/><input value={blueprintSearch} onChange={e=>setBlueprintSearch(e.target.value)} placeholder="Blueprint yoki material qidirish..."/></div><div className="filter-chips">{blueprintGroups.map(g=><button key={g} className={blueprintGroup===g?'selected':''} onClick={()=>setBlueprintGroup(g)}>{g}</button>)}</div></div>
          <div className="blueprint-list">{filteredBlueprints.map((b,i)=><article className="panel blueprint-row clickable-card" key={b.name} role="button" tabIndex={0} onClick={()=>setWikiDetail({kind:'blueprint',name:b.name})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setWikiDetail({kind:'blueprint',name:b.name})}}}><div className="blueprint-index">{String(i+1).padStart(2,'0')}</div><div className="blueprint-main"><span className="panel-kicker">{b.group}</span><h2>{b.name}</h2><p>{b.note}</p></div><div className="blueprint-materials"><small>KERAKLI MATERIALLAR</small><b>{b.cost}</b></div><span className="workbench-badge">{b.level}</span></article>)}{filteredBlueprints.length===0&&<div className="empty-state">Blueprint topilmadi.</div>}</div>
          <div className="source-note"><Info size={15}/><span>Blueprint va retseptlar bazaviy vanilla Rust ma’lumotlari asosida tuzilgan. Yangilanishlar, server sozlamalari va blueprint fragment tizimidagi o‘zgarishlar sabab qiymatlarni o‘yin ichida tekshiring.</span></div>
        </>}
      </section>
      <section className="tools-section"><div className="section"><div className="section-heading"><div><div className="section-kicker">02 / AMALIY VOSITALAR</div><h2>Hisoblang. <em>Rejalashtiring.</em></h2><p>Hozir ishlaydigan raid kalkulyatori va monument qo‘llanmalari mavjud.</p></div></div><div className="tool-grid">
        <button className="tool-card" onClick={() => setTab('raid')}><div className="tool-top"><span>01</span><Shield size={23}/></div><small>ISHLAYDI</small><h3>Raid kalkulyatori</h3><p>Devor va eshiklar uchun portlovchi vositalar hamda oltingugurt miqdorini hisoblang.</p><b>Ochish <ArrowUpRight size={15}/></b></button>
        <button className="tool-card" onClick={() => setTab('monuments')}><div className="tool-top"><span>02</span><MapPin size={23}/></div><small>MA’LUMOTLAR</small><h3>Monument ensiklopediyasi</h3><p>Hududlar, xavflar, loot va tayyorgarlik bo‘yicha qo‘llanmalar.</p><b>Ochish <ArrowUpRight size={15}/></b></button>
        <button className="tool-card" onClick={() => setTab('craft')}><div className="tool-top"><span>03</span><Hammer size={23}/></div><small>ISHLAYDI</small><h3>Craft kalkulyatori</h3><p>Retseptlar va xomashyo hisob-kitobi.</p><b>Ochish <ArrowUpRight size={15}/></b></button>
        <button className="tool-card" onClick={() => setTab('recycler')}><div className="tool-top"><span>04</span><Recycle size={23}/></div><small>ISHLAYDI</small><h3>Recycler kalkulyatori</h3><p>Qayta ishlashdan chiqadigan resurslar.</p><b>Ochish <ArrowUpRight size={15}/></b></button>
      </div></div></section>
    </main>}

    {tab === 'raid' && <main className="page-main">
      <div className="page-intro"><div className="section-kicker">OUTPOST TOOLS / 01</div><h1>Raid <em>kalkulyatori.</em></h1><p>Qaysi devor yoki eshikni buzmoqchisiz? Nishonlar sonini kiriting — kerakli portlovchi vositalar va taxminiy oltingugurt sarfi hisoblanadi.</p></div>
      <div className="raid-layout">
        <section className="panel raid-panel"><div className="panel-heading"><div><span className="panel-kicker">RAID REJASI</span><h2>Nishonlar ro‘yxati</h2></div><button className="outline-button" onClick={addRaidLine}><Plus size={16}/> Nishon qo‘shish</button></div>
          {raidLines.map(line => <div className="raid-line" key={line.id}>
            <label><span>NISHON</span><select value={line.targetId} onChange={e => updateLine(line.id,{targetId:e.target.value})}>{raidTargets.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label className="quantity-field"><span>SONI</span><div className="quantity-control"><button onClick={()=>updateLine(line.id,{quantity:Math.max(1,line.quantity-1)})}><Minus size={14}/></button><input type="number" min="1" max="999" value={line.quantity} onChange={e=>updateLine(line.id,{quantity:Math.max(1,Number(e.target.value)||1)})}/><button onClick={()=>updateLine(line.id,{quantity:line.quantity+1})}><Plus size={14}/></button></div></label>
            <div className="target-hp"><span>HP</span><b>{format(getTarget(line.targetId).hp)}</b></div>
            <button className="icon-button remove-button" aria-label="O‘chirish" onClick={()=>removeLine(line.id)}><Trash2 size={16}/></button>
          </div>)}
          <div className="raid-method"><span>HISOBLASH USULI</span><div className="method-options"><button className={raidMethod==='cheapest'?'selected':''} onClick={()=>setRaidMethod('cheapest')}>Eng kam sulfur</button>{raidMethods.map(m=><button key={m.id} className={raidMethod===m.id?'selected':''} onClick={()=>setRaidMethod(m.id)}>{m.short}</button>)}</div></div>
          <div className="raid-note"><Info size={16}/><p>Hisob to‘liq HP, tashqi tomondan hujum va standart portlovchi sarfiga asoslangan. Server modlari, yangilanishlar va nishonning avval shikastlanganligi natijani o‘zgartirishi mumkin.</p></div>
        </section>
        <aside className="panel result-panel"><span className="panel-kicker">HISOB NATIJASI</span><h2>{raidMethod==='cheapest'?'Eng tejamkor variant':selectedTotal?.label}</h2>
          {selectedTotal && <><div className="result-big"><strong>{format(selectedTotal.units)}</strong><span>{selectedTotal.short} dona</span></div><div className="sulfur-total"><span>Jami oltingugurt</span><b>{format(selectedTotal.sulfur)} <small>SULFUR</small></b></div><div className="result-details"><div><span>Nishonlar soni</span><b>{format(totalTargets)}</b></div><div><span>Hisoblangan obyekt qatori</span><b>{raidLines.length}</b></div></div></>}
          <div className="compare-title">BARCHA USULLAR TAQQOSLANISHI</div>
          <div className="comparison">{totals.map(t=><div className={selectedTotal?.id===t.id?'comparison-row best':''} key={t.id}><span>{t.short}</span><b>{format(t.units)} dona</b><small>{format(t.sulfur)} sulfur</small></div>)}</div>
        </aside>
      </div>
      <div className="source-note"><Info size={15}/> <span>Ma’lumotlar: Rust Codex / Betrefs raid chart, 2026-yil oktabrda tekshirilgan qiymatlar. Rasmiy patchdan keyin qayta tekshirish kerak.</span></div>
    </main>}

    {tab === 'monuments' && <main className="page-main">
      <div className="page-intro"><div className="section-kicker">OUTPOST ENCYCLOPEDIA / 02</div><h1>Monument <em>ensiklopediyasi.</em></h1><p>Rust xaritasidagi muhim hududlar, xavf darajasi, loot va borishdan oldingi tayyorgarlik bo‘yicha o‘zbekcha qo‘llanma.</p></div>
      <div className="monument-tools"><div className="search-wrap monument-search"><Search size={18}/><input value={monumentQuery} onChange={e=>setMonumentQuery(e.target.value)} placeholder="Monument qidirish..."/></div><div className="filter-chips">{['Barchasi','Xavfsiz hudud','Kichik monument','O‘rta monument','Katta monument','Dengiz monumenti'].map(t=><button key={t} className={monumentType===t?'selected':''} onClick={()=>setMonumentType(t)}>{t}</button>)}</div></div>
      <div className="monument-layout"><div className="monument-list">{filteredMonuments.map(m=><button key={m.name} className={selectedMonument===m.name?'monument-card active':'monument-card'} onClick={()=>setSelectedMonument(m.name)}>{(m.image_url || monumentImages[m.name]) ? <span className="monument-thumb"><img src={m.image_url || monumentImages[m.name]} alt="" loading="lazy" onError={e=>{e.currentTarget.parentElement?.classList.add('no-image')}}/></span> : <span className={`monument-dot ${m.color}`}></span>}<span><b>{m.name}</b><small>{m.type}</small></span><ArrowUpRight size={16}/></button>)}{filteredMonuments.length===0&&<div className="empty-state">Monument topilmadi.</div>}</div>
        {(() => { const m=catalogMonuments.find(x=>x.name===selectedMonument) ?? filteredMonuments[0] ?? catalogMonuments[0]; return <article className="panel monument-detail"><div className="monument-detail-top"><span className={`monument-badge ${m.color}`}>{m.type}</span><span className="detail-index">OUTPOST / FIELD GUIDE</span></div><div className="monument-hero">{(m.image_url || monumentImages[m.name]) && <img src={m.image_url || monumentImages[m.name]} alt={`${m.name} Rust monument`} loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>}<div className="monument-hero-shade"><span>{m.name.toUpperCase()}</span><small>RUST FIELD GUIDE</small></div></div><h2>{m.name}</h2><p className="monument-description">{m.desc}</p><div className="monument-facts"><div><small>MONUMENT TURI</small><b>{m.size}</b></div><div><small>TIER</small><b>{(m.stats || monumentStats[m.name])?.tier ?? '—'}</b></div><div><small>CRATE / BARREL</small><b>{(m.stats || monumentStats[m.name]) ? `${(m.stats || monumentStats[m.name]).crates} / ${(m.stats || monumentStats[m.name]).barrels}` : '—'}</b></div><div><small>SCIENTIST</small><b>{(m.stats || monumentStats[m.name])?.scientists ?? '—'}</b></div><div><small>RECYCLER</small><b>{(m.stats || monumentStats[m.name])?.recyclers ?? '—'}</b></div><div><small>RADIATSIYA</small><b>{(m.stats || monumentStats[m.name])?.radiation ?? '—'}</b></div></div>{m.name === 'Airfield' && <section className="airfield-map-section">
          <div className="airfield-map-heading"><div><span className="section-kicker">OUTPOST INTERACTIVE MAP / 01</span><h3>Airfield <em>taktik xaritasi.</em></h3><p>Haqiqiy aerial ko‘rinish, hudud sxemasi va puzzle yo‘nalishi — bir joyda.</p></div><span className="map-live-tag">BETA · AIRFIELD</span></div>
          <div className="airfield-map-tabs">
            <button className={airfieldMapMode==='real'?'selected':''} onClick={()=>setAirfieldMapMode('real')}>Haqiqiy xarita</button>
            <button className={airfieldMapMode==='schematic'?'selected':''} onClick={()=>setAirfieldMapMode('schematic')}>Hudud sxemasi</button>
            <button className={airfieldMapMode==='puzzle'?'selected':''} onClick={()=>setAirfieldMapMode('puzzle')}>Puzzle sxemasi</button>
          </div>
          {airfieldMapMode==='real' && <div className="airfield-real-map"><img src="https://guided.news/wp-content/uploads/2021/06/rust-airfield-blue-doors.jpg" alt="Rust Airfield monument aerial in-game view" onError={e=>{e.currentTarget.style.display='none'; const n=e.currentTarget.nextElementSibling as HTMLElement|null; if(n)n.style.display='block'}}/><div className="map-image-fallback">Haqiqiy aerial rasm yuklanmadi. Pastdagi hudud sxemasidan foydalaning.</div><small>Haqiqiy o‘yin xaritasidan olingan aerial ko‘rinish · tashqi manba</small></div>}
          {airfieldMapMode==='schematic' && <div className="airfield-schematic-wrap"><div className="airfield-schematic">
            <div className="map-runway runway-a">RUNWAY 23</div><div className="map-runway runway-b">RUNWAY 22</div>
            <button className="map-point point-terminal" onClick={()=>setAirfieldMapPoint('terminal')}><b>01</b><span>Terminal / ATC</span></button>
            <button className="map-point point-hangar-one" onClick={()=>setAirfieldMapPoint('hangars')}><b>02</b><span>Hangarlar</span></button>
            <button className="map-point point-tunnel" onClick={()=>setAirfieldMapPoint('tunnel')}><b>03</b><span>Tunnel kirishi</span></button>
            <button className="map-point point-helipad" onClick={()=>setAirfieldMapPoint('helipad')}><b>04</b><span>Helipad</span></button>
            <button className="map-point point-recycler" onClick={()=>setAirfieldMapPoint('recycler')}><b>05</b><span>Recycler ×2</span></button>
            <div className="map-schematic-label">AIRFIELD · HUDUD JOYLASHUVI</div>
          </div><div className="map-point-info"><span>NUQTA {airfieldMapPoint==='terminal'?'01':airfieldMapPoint==='hangars'?'02':airfieldMapPoint==='tunnel'?'03':airfieldMapPoint==='helipad'?'04':'05'}</span><b>{airfieldMapPointTitles[airfieldMapPoint]}</b><p>{airfieldMapPointDescriptions[airfieldMapPoint]}</p></div></div>}
          {airfieldMapMode==='puzzle' && <div className="airfield-puzzle-flow"><div className="puzzle-flow-meta"><span>KERAK: 2 ELECTRIC FUSE</span><span>GREEN + BLUE KEYCARD</span></div><div className="puzzle-flow-grid"><div className="puzzle-flow-node"><b>01</b><strong>Terminal / ATC</strong><small>Fuse box #1 · timer switch</small></div><i>↓</i><div className="puzzle-flow-node"><b>02</b><strong>Tunnel entrance</strong><small>Yerosti yo‘lagiga tushing</small></div><i>↓</i><div className="puzzle-flow-node"><b>03</b><strong>Green door</strong><small>Green Keycard bilan oching</small></div><i>↓</i><div className="puzzle-flow-node"><b>04</b><strong>Armory corridor</strong><small>Fuse box #2 · elektrni yoqing</small></div><i>↓</i><div className="puzzle-flow-node puzzle-flow-final"><b>05</b><strong>Blue door / Armory</strong><small>Blue Keycard · Red Keycard loot</small></div></div><p className="puzzle-flow-warning"><Info size={14}/> Bu yo‘nalish umumiy qo‘llanma. Server versiyasi va monument holatiga qarab ayrim tafsilotlar farq qilishi mumkin.</p></div>}
          <div className="airfield-map-legend"><span><i className="legend-orange"/> Puzzle / karta eshigi</span><span><i className="legend-blue"/> Xizmat / recycler</span><span><i className="legend-green"/> Muhim nuqta</span></div>
          <small className="map-disclaimer">Sxema navigatsion yordam uchun soddalashtirilgan; aniq bino va loot koordinatalari server seediga qarab farq qiladi.</small>
        </section>}<div className="detail-block"><h3><MapPin size={16}/> Hudud haqida</h3><p>{m.loot}</p></div><div className="detail-block"><h3><Shield size={16}/> Borishdan oldin</h3><ul>{m.tips.map(t=><li key={t}>{t}</li>)}</ul></div>{(m.puzzle || monumentPuzzles[m.name]) && <div className="puzzle-panel"><div className="puzzle-heading"><h3><Zap size={16}/> Puzzle qo‘llanmasi</h3><span>KEYCARD RUN</span></div><div className="puzzle-requirements"><div><small>KERAKLI KEYCARD</small><b>{(m.puzzle || monumentPuzzles[m.name]).cards}</b></div><div><small>FUSE</small><b>{(m.puzzle || monumentPuzzles[m.name]).fuses}</b></div></div><ol>{(m.puzzle || monumentPuzzles[m.name]).route.map((step,i)=><li key={step}><span>{String(i+1).padStart(2,'0')}</span>{step}</li>)}</ol><div className="puzzle-reward"><small>PUZZLE MUKOFOTI</small><b>{(m.puzzle || monumentPuzzles[m.name]).reward}</b></div>{(m.puzzle || monumentPuzzles[m.name]).note && <p className="puzzle-note"><Info size={14}/>{(m.puzzle || monumentPuzzles[m.name]).note}</p>}</div>}<div className="detail-foot"><Info size={15}/> Puzzle talablari va loot server versiyasi, map seed va yangilanishlarga qarab farq qilishi mumkin. Ma’lumotni safar oldidan tekshiring.</div>{(m.source_url || monumentSourceUrls[m.name]) && <a className="monument-source-link" href={m.source_url || monumentSourceUrls[m.name]} target="_blank" rel="noreferrer">Ma’lumot manbasi: RustHelp <ExternalLink size={13}/></a>}</article> })()}
      </div>
    </main>}


    {tab === 'recycler' && <main className="page-main">
      <div className="page-intro"><div className="section-kicker">OUTPOST TOOLS / 03</div><h1>Recycler <em>kalkulyatori.</em></h1><p>Qayta ishlamoqchi bo‘lgan komponentlaringizni tanlang. Recycler turiga qarab taxminiy resurs chiqimini hisoblang.</p></div>
      <div className="recycler-rate-grid">{managedRecyclerRates.map(r=><button key={r.id} className={recycleRate===r.id?'rate-card selected':'rate-card'} onClick={()=>setRecycleRate(r.id)}><span>{r.name}</span><b>{Math.round(r.rate*100)}%</b><small>{r.label}</small><em>{r.seconds}s / cycle</em></button>)}</div>
      <div className="recycler-layout"><section className="panel"><div className="panel-heading"><div><span className="panel-kicker">KIRUVCHI BUYUMLAR</span><h2>Inventar tanlang</h2></div><span className="small-muted">{recycleInputCount} dona buyum</span></div>
        <div className="search-wrap inner-search"><Search size={17}/><input value={recycleSearch} onChange={e=>setRecycleSearch(e.target.value)} placeholder="Komponent yoki buyum qidirish..."/></div>
        <div className="recycle-item-list">{filteredRecycleItems.map(item=><div className="recycle-item" key={item.name}><div className="recycle-item-icon">{(item.image_url || itemIconUrl(item.name))?<img src={(item.image_url || itemIconUrl(item.name))} alt={item.name} loading="lazy"/>:<Recycle size={17}/>}</div><div className="recycle-item-name"><b>{item.name}</b><small>{item.category}</small></div><div className="recycle-yield">{item.yields.map(y=><small key={y.name}>{y.name}: {Number.isInteger(y.amount)?y.amount:y.amount.toFixed(1)}</small>)}</div><div className="quantity-control"><button onClick={()=>setRecycleQuantities(q=>({...q,[item.name]:Math.max(0,(q[item.name]??0)-1)}))}><Minus size={13}/></button><input type="number" min="0" value={recycleQuantities[item.name]??0} onChange={e=>setRecycleQuantities(q=>({...q,[item.name]:Math.max(0,Number(e.target.value)||0)}))}/><button onClick={()=>setRecycleQuantities(q=>({...q,[item.name]:(q[item.name]??0)+1}))}><Plus size={13}/></button></div></div>)}</div>
      </section><aside className="panel result-panel"><span className="panel-kicker">TAXMINIY NATIJA</span><h2>{activeRecycler.name}</h2><div className="result-big"><strong>{format(recycleInputCount)}</strong><span>ta buyum</span></div><div className="compare-title">QAYTA ISHLASHDAN CHIQADI</div>
        {recycleTotals.length ? <div className="recycle-results">{recycleTotals.map(([name,amount])=><div className="recycle-result" key={name}><span>{name}</span><b>{Number.isInteger(amount)?format(amount):amount.toFixed(1)}</b></div>)}</div> : <div className="empty-state">Natijani ko‘rish uchun chap tomondan buyumlar sonini kiriting.</div>}
        <div className="result-details"><div><span>Recycler vaqti</span><b>{format(recycleInputCount*activeRecycler.seconds)} soniya</b></div><div><span>Cycle</span><b>{activeRecycler.seconds}s / dona</b></div></div>
        <button className="outline-button full-button" onClick={()=>setRecycleQuantities({})}><Trash2 size={15}/> Tozalash</button>
      </aside></div>
      <div className="source-note"><Info size={15}/><span>Natijalar taxminiy kutiladigan qiymat sifatida beriladi. O‘yinda chiqim butun sonlarga yaxlitlanadi va ayrim materiallar ehtimollik bilan tushadi. Recycler samaradorligi hudud va elektr ta’minotiga qarab farqlanadi.</span></div>
    </main>}

    {tab === 'craft' && <main className="page-main">
      <div className="page-intro"><div className="section-kicker">OUTPOST TOOLS / 04</div><h1>Craft <em>kalkulyatori.</em></h1><p>Yasamoqchi bo‘lgan buyumni tanlang. OUTPOST kerakli xomashyo miqdorini, workbench darajasini va taxminiy craft vaqtini hisoblaydi.</p></div>
      <div className="craft-layout"><section className="panel craft-select-panel"><span className="panel-kicker">RESEPTLAR BAZASI</span><h2>Buyumni tanlang</h2>
        <div className="search-wrap inner-search"><Search size={17}/><input value={craftSearch} onChange={e=>setCraftSearch(e.target.value)} placeholder="Buyum nomini qidirish..."/></div>
        <div className="craft-recipe-list">{filteredCraftRecipes.map(r=><button key={r.name} className={selectedRecipe===r.name?'craft-recipe selected':'craft-recipe'} onClick={()=>setSelectedRecipe(r.name)}><span className="craft-recipe-icon">{itemIconUrl(r.name)?<img src={itemIconUrl(r.name)} alt={r.name} loading="lazy"/>:<Hammer size={17}/>}</span><span><b>{r.name}</b><small>{r.category} · {r.workbench===0?'Workbench talab qilinmaydi':`Workbench ${r.workbench}`}</small></span><ArrowUpRight size={15}/></button>)}</div>
      </section><section className="panel craft-result-panel"><div className="panel-heading"><div><span className="panel-kicker">CRAFT RECIPE</span><h2>{recipe.name}</h2></div><span className="workbench-badge">{recipe.workbench===0?'NO WB':`WB ${recipe.workbench}`}</span></div>
        <div className="craft-quantity"><label>YASALADIGAN MIQDOR</label><div className="quantity-control"><button onClick={()=>setCraftQuantity(q=>Math.max(1,q-1))}><Minus size={14}/></button><input type="number" min="1" value={craftQuantity} onChange={e=>setCraftQuantity(Math.max(1,Number(e.target.value)||1))}/><button onClick={()=>setCraftQuantity(q=>q+1)}><Plus size={14}/></button></div></div>
        <div className="craft-summary"><div><span>Workbench</span><b>{recipe.workbench===0?'Talab qilinmaydi':`Level ${recipe.workbench}`}</b></div><div><span>Craft vaqti</span><b>{format(recipe.seconds*craftQuantity)} soniya</b></div><div><span>Natija</span><b>{format(craftQuantity)} dona</b></div></div>
        <div className="compare-title">KERAKLI MATERIALLAR</div><div className="craft-ingredients">{recipe.ingredients.map(i=><div className="craft-ingredient" key={i.name}><span><Package size={15}/>{i.name}</span><b>{format(i.amount*craftQuantity)}</b></div>)}</div>
        <div className="raid-note"><Info size={16}/><p>Ko‘rsatilgan craft vaqti bazaviy vaqt bo‘yicha hisoblangan. Workbench darajasi, server crafting tezligi va bufflar haqiqiy vaqtga ta’sir qilishi mumkin.</p></div>
      </section></div>
      <div className="source-note"><Info size={15}/><span>Retseptlar Facepunch Rust Wiki item sahifalaridan olingan. Hozircha boshlang‘ich retseptlar to‘plami; keyingi bosqichda itemlar bazasi kengaytiriladi.</span></div>
    </main>}

    {wikiDetail && <div className="wiki-detail-backdrop" role="presentation" onClick={()=>setWikiDetail(null)}>
      <section className="wiki-detail-modal" role="dialog" aria-modal="true" aria-label="Wiki buyum tafsilotlari" onClick={e=>e.stopPropagation()}>
        <button className="wiki-detail-close" onClick={()=>setWikiDetail(null)} aria-label="Yopish"><X size={20}/></button>
        {wikiDetail.kind === 'item' && (() => { const item=catalogItems.find(x=>x.name===wikiDetail.name); if(!item) return null; const weapon=weaponProfiles.find(w=>w.name===item.name || w.name.startsWith(item.name.split(' ')[0])); const craft=managedCraftRecipes.find(r=>r.name===item.name); const bp=blueprintGuides.find(b=>b.name===item.name); const meta=itemMeta[item.name]; const chain=chainRecipes[item.name]; return <>
          <div className="wiki-detail-visual item-detail-visual">{(item.image_url || itemIconUrl(item.name)) ? <img src={(item.image_url || itemIconUrl(item.name))} alt={item.name} onError={e=>{e.currentTarget.style.display="none"}}/> : <span>{item.icon}</span>}<small>{item.category.toUpperCase()} · {meta?.shortname || 'ITEM'}</small></div>
          <span className="panel-kicker">OUTPOST REAL ITEM DATABASE</span><h2>{item.name}</h2><p className="wiki-detail-description">{item.description}.</p>
          <div className="wiki-detail-facts"><div><small>KATEGORIYA</small><b>{item.category}</b></div><div><small>SHORTNAME</small><b>{meta?.shortname || itemShortnames[item.name] || 'Ma’lumot kiritilmagan'}</b></div><div><small>ITEM ID</small><b>{meta?.id || 'Ma’lumot kiritilmagan'}</b></div><div><small>STACK SIZE</small><b>{meta?.stack || 'Tekshirilmoqda'}</b></div><div><small>DESPAWN</small><b>{meta?.despawn || 'Tekshirilmoqda'}</b></div><div><small>WORKBENCH</small><b>{meta?.workbench ? `Level ${meta.workbench}` : (craft ? (craft.workbench===0?'Talab qilinmaydi':`Level ${craft.workbench}`) : 'Craft talab qilinmaydi / noma’lum')}</b></div></div>
          {meta?.stats && <div className="detail-block"><h3><Crosshair size={16}/> O‘yin statistikasi</h3><div className="wiki-detail-facts">{meta.stats.map(x=><div key={x.label}><small>{x.label}</small><b>{x.value}</b></div>)}</div></div>}
          {(meta?.research || bp) && <div className="detail-block"><h3><BookOpen size={16}/> Blueprint / Research</h3><p>{meta?.research || bp?.cost || 'Blueprint ma’lumoti kiritilmagan'}</p></div>}
          {(meta?.recipe || craft) && <div className="detail-block"><h3><Hammer size={16}/> Craft retsepti</h3><div className="chain-ingredients">{(meta?.recipe || craft?.ingredients || []).map(x=><div key={x.name}><span>{itemIconUrl(x.name)?<img src={itemIconUrl(x.name)} alt="" loading="lazy"/>:<Package size={15}/>} {x.name}</span><b>×{x.amount}</b></div>)}</div><p>{meta?.output ? `Natija: ${meta.output}. ` : ''}{meta?.craftTime || (craft ? `${craft.seconds} soniya · Workbench ${craft.workbench}` : '')}</p></div>}
          {chain && <div className="detail-block"><h3><Boxes size={16}/> Crafting zanjiri</h3><p className="chain-caption">1 dona yakuniy buyum uchun kerakli ingredientlar. Oraliq retseptlar batch hajmi bo‘yicha hisoblanadi:</p><div className="craft-tree">{chain.map((x,i)=><CraftTreeNode key={`${item.name}-${x.name}-${i}`} name={x.name} amount={x.amount}/>)}</div><p className="chain-caption">Craft qilinmaydigan komponentlar yakuniy ingredient sifatida ko‘rsatiladi; ularni loot, savdo yoki yig‘ish orqali topish mumkin.</p></div>}
          {(() => { const usedIn=Object.entries(chainRecipes).filter(([,ingredients])=>ingredients.some(x=>x.name===item.name)); return usedIn.length>0 ? <div className="detail-block"><h3><Hammer size={16}/> Qaysi retseptlarda ishlatiladi?</h3><div className="used-in-list">{usedIn.map(([product,ingredients])=><div key={product}><span>{itemIconUrl(product)?<img src={itemIconUrl(product)} alt=""/>:<Package size={15}/>} {product}</span><b>×{ingredients.find(x=>x.name===item.name)?.amount}</b></div>)}</div></div> : null })()}
          {meta?.loot && <div className="detail-block"><h3><Package size={16}/> Loot manbalari</h3><div className="loot-table"><div className="loot-table-head"><span>MANBA</span><span>CHANCE</span><span>MIQDOR</span></div>{meta.loot.map(x=><div className="loot-table-row" key={x.source}><span>{x.source}</span><b>{x.chance}</b><span>{x.amount}</span></div>)}</div></div>}
          {meta?.note && <div className="detail-foot"><Info size={15}/> {meta.note}</div>}
          {meta?.sourceUrl && <a className="item-source-link" href={meta.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Manba va to‘liq ma’lumotni ko‘rish</a>}
          {!meta && <div className="detail-foot"><Info size={15}/> Bu item uchun rasm va ayrim identifikatorlar qo‘shildi. To‘liq statistikasi va loot jadvali keyingi ma’lumotlar importida to‘ldiriladi.</div>}
          {(bp || weapon) && <div className="detail-block"><h3><BookOpen size={16}/> Bog‘liq ma’lumotlar</h3>{bp&&<p><b>Blueprint:</b> {bp.cost} · {bp.level}</p>}{weapon&&<p><b>Qurol:</b> {weapon.type} · O‘q-dori: {weapon.ammo} · {weapon.role}</p>}</div>}
        </> })()}
        {wikiDetail.kind === 'weapon' && (() => { const w=weaponProfiles.find(x=>x.name===wikiDetail.name); if(!w) return null; const craft=managedCraftRecipes.find(x=>x.name===w.name); const meta=itemMeta[w.name] || (w.name.startsWith('Assault Rifle') ? itemMeta['AK-47 (Assault Rifle)'] : undefined); return <>
          <div className="wiki-detail-visual item-detail-visual">{itemIconUrl(w.name.startsWith("Assault Rifle") ? "AK-47 (Assault Rifle)" : w.name) ? <img src={itemIconUrl(w.name.startsWith("Assault Rifle") ? "AK-47 (Assault Rifle)" : w.name)} alt={w.name}/> : <span>{w.icon}</span>}<small>{w.type.toUpperCase()}</small></div><span className="panel-kicker">OUTPOST WEAPON DATABASE</span><h2>{w.name}</h2><p className="wiki-detail-description">{w.desc}</p>
          <div className="wiki-detail-facts"><div><small>QUROL TURI</small><b>{w.type}</b></div><div><small>O‘Q-DORI</small><b>{w.ammo}</b></div><div><small>DARAJA</small><b>{w.tier}</b></div><div><small>JANG MASOFASI</small><b>{w.role}</b></div><div><small>OLISH USULI</small><b>{w.craft}</b></div></div>
          {craft&&<div className="detail-block"><h3><Hammer size={16}/> Craft retsepti</h3><p>{craft.ingredients.map(x=>`${x.amount} ${x.name}`).join(' · ')}. Workbench {craft.workbench} · {craft.seconds} soniya.</p></div>}
          {meta?.stats && <div className="detail-block"><h3><Crosshair size={16}/> O‘yin statistikasi</h3><div className="wiki-detail-facts">{meta.stats.map(x=><div key={x.label}><small>{x.label}</small><b>{x.value}</b></div>)}</div></div>}
          {meta?.recipe && <div className="detail-block"><h3><Hammer size={16}/> Craft retsepti</h3><p>{meta.recipe.map(x=>`${x.amount} ${x.name}`).join(' · ')}. {meta.craftTime || ''} · {meta.workbench ? `Workbench ${meta.workbench}` : ''}</p></div>}
          {meta?.loot && <div className="detail-block"><h3><Package size={16}/> Loot manbalari</h3><div className="loot-table">{meta.loot.map(x=><div className="loot-table-row" key={x.source}><span>{x.source}</span><b>{x.chance}</b><span>{x.amount}</span></div>)}</div></div>}
          {meta?.sourceUrl && <a className="item-source-link" href={meta.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Manba va to‘liq ma’lumotni ko‘rish</a>}
          <div className="detail-foot"><Info size={15}/> Damage, recoil va boshqa raqamli parametrlar tekshirilgan manba qo‘shilgach kiritiladi.</div>
        </> })()}
        {wikiDetail.kind === 'blueprint' && (() => { const b=blueprintGuides.find(x=>x.name===wikiDetail.name); if(!b) return null; const craft=managedCraftRecipes.find(x=>x.name===b.name); return <>
          <div className="wiki-detail-visual"><span>📘</span><small>{b.group.toUpperCase()}</small></div><span className="panel-kicker">OUTPOST BLUEPRINT DATABASE</span><h2>{b.name}</h2><p className="wiki-detail-description">{b.note}</p>
          <div className="wiki-detail-facts"><div><small>GURUH</small><b>{b.group}</b></div><div><small>KERAKLI DARAJA</small><b>{b.level}</b></div></div>
          <div className="detail-block"><h3><Package size={16}/> Kerakli materiallar</h3><p>{b.cost}</p></div>
          {craft&&<div className="detail-block"><h3><Hammer size={16}/> Craft ma’lumoti</h3><p>{craft.seconds} soniya · {craft.workbench===0?'Workbench talab qilinmaydi':`Workbench ${craft.workbench}`}</p></div>}
          <div className="detail-foot"><Info size={15}/> Blueprint narxi va talablar server sozlamalari yoki o‘yin yangilanishlariga qarab farq qilishi mumkin.</div>
        </> })()}
      </section>
    </div>}

    <AdSlot placement="footer" />
    <footer><a className="brand" href="#top" onClick={()=>setTab('wiki')}><span className="brand-mark">{siteSettings.site_logo_url ? <img src={siteSettings.site_logo_url} alt="" onError={e=>{e.currentTarget.style.display="none"}}/> : "O"}</span><span>{siteSettings.site_name.replace(/\s+UZ$/i, "")}<span className="brand-muted"> {siteSettings.site_name.toUpperCase().endsWith("UZ") ? "UZ" : ""}</span><small>RUST WIKI · O‘ZBEKCHA</small></span></a><p>Mustaqil hamjamiyat loyihasi. Rust — Facepunch Studios savdo belgisi. {siteSettings.site_name} Facepunch Studios bilan bog‘liq emas.{siteSettings.contact_email ? <> Aloqa: <a href={`mailto:${siteSettings.contact_email}`}>{siteSettings.contact_email}</a></> : null}</p><span>© 2026 {siteSettings.site_name} · v1.7.1</span></footer>
  </div>
}
