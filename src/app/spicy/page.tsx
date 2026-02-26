"use client";

import React, { useState } from 'react';
import { hapticFeedback } from '@/lib/utils/haptics';
import confetti from 'canvas-confetti';
import BackButton from '@/components/BackButton';

/* в”Ђв”Ђв”Ђ Data в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

const TRUTH_QUESTIONS = [
    "Р§С‚Рѕ С‚РµР±Рµ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ РЅСЂР°РІРёС‚СЃСЏ РІ РЅР°С€РµРј РїР°СЂС‚РЅС‘СЂСЃС‚РІРµ?",
    "РљР°РєРѕР№ РјРѕРјРµРЅС‚ РІ РЅР°С€РёС… РѕС‚РЅРѕС€РµРЅРёСЏС… С‚С‹ РІСЃРїРѕРјРёРЅР°РµС€СЊ СЃ РЅР°РёР±РѕР»СЊС€РµР№ С‚РµРїР»РѕС‚РѕР№?",
    "Р§РµРіРѕ С‚С‹ РЅРёРєРѕРіРґР° РЅРµ РґРµР»Р°Р» Рё С…РѕС‡РµС‚ РїРѕРїСЂРѕР±РѕРІР°С‚СЊ РІРјРµСЃС‚Рµ СЃРѕ РјРЅРѕР№?",
    "РљР°РєРѕРІР° С‚РІРѕСЏ СЃР°РјР°СЏ Р·Р°РІРµС‚РЅР°СЏ РјРµС‡С‚Р° РґР»СЏ РЅР°СЃ РґРІРѕРёС…?",
    "Р§С‚Рѕ СЏ РґРµР»Р°СЋ, С‡С‚Рѕ С‚РµР±СЏ С‚Р°Р№РЅРѕ РІРѕСЃС…РёС‰Р°РµС‚?",
    "Р§С‚Рѕ С‚РµР±СЏ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ РІ Р¶РёР·РЅРё РїСѓРіР°РµС‚ Рё РїРѕС‡РµРјСѓ?",
    "РћРїРёС€Рё СЃРІРѕР№ РёРґРµР°Р»СЊРЅС‹Р№ РґРµРЅСЊ СЃ РїР°СЂС‚РЅС‘СЂРѕРј вЂ” РѕС‚ СѓС‚СЂР° РґРѕ РЅРѕС‡Рё.",
    "РљР°РєР°СЏ С‡РµСЂС‚Р° РјРѕРµРіРѕ С…Р°СЂР°РєС‚РµСЂР° С‚РµР±Рµ РЅСЂР°РІРёС‚СЃСЏ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ?",
    "Р“РґРµ С‚С‹ РјРµС‡С‚Р°РµС€СЊ РїРѕР±С‹РІР°С‚СЊ СЃРѕ РјРЅРѕР№ Рё РїРѕС‡РµРјСѓ РёРјРµРЅРЅРѕ С‚Р°Рј?",
    "Р§РµРіРѕ С‚РµР±Рµ РЅРµ С…РІР°С‚Р°РµС‚ РІ РЅР°С€РёС… РѕС‚РЅРѕС€РµРЅРёСЏС… РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ?",
    "РљР°РєРѕР№ Сѓ С‚РµР±СЏ СЃР°РјС‹Р№ СЃС‚С‘СЂС‚С‹Р№ СЃРµРєСЂРµС‚, РєРѕС‚РѕСЂС‹Р№ С‚С‹ РЅРёРєРѕРіРґР° РЅРµ СЂР°СЃСЃРєР°Р·С‹РІР°Р»?",
    "РљР°Рє С‚С‹ РїРѕРЅСЏР» С‡С‚Рѕ РІР»СЋР±РёР»СЃСЏ РІ РјРµРЅСЏ?",
    "Р§С‚Рѕ С‚РµР±СЏ РїСЂРёСЏС‚РЅРѕ СѓРґРёРІРёР»Рѕ РІ РЅР°С€РµРј СЃРѕСЋР·Рµ?",
    "Р•СЃР»Рё Р±С‹ РјС‹ РїРѕРјРµРЅСЏР»РёСЃСЊ СЂРѕР»СЏРјРё РЅР° РѕРґРёРЅ РґРµРЅСЊ вЂ” С‡С‚Рѕ Р±С‹ С‚С‹ СЃРґРµР»Р°Р»?",
    "РљР°РєРѕРµ СЃР°РјРѕРµ СЂРѕРјР°РЅС‚РёС‡РµСЃРєРѕРµ, С‡С‚Рѕ СЏ РєРѕРіРґР°-Р»РёР±Рѕ РґРµР»Р°Р» РґР»СЏ С‚РµР±СЏ?",
];

const DARE_CHALLENGES = [
    "РќР°РїРѕР№ Р»СЋР±РёРјСѓСЋ РїРµСЃРЅСЋ РїР°СЂС‚РЅС‘СЂР° СЃ РІС‹СЂР°Р¶РµРЅРёРµРј.",
    "РќР°РїРёС€Рё РїР°СЂС‚РЅС‘СЂСѓ РєРѕРјРїР»РёРјРµРЅС‚ РёР· 20 СЃР»РѕРІ, РЅРµ РїРѕРІС‚РѕСЂСЏСЏ РЅРё РѕРґРЅРѕРіРѕ РїСЂРёР»Р°РіР°С‚РµР»СЊРЅРѕРіРѕ РґРІР°Р¶РґС‹.",
    "РР·РѕР±СЂР°Р·Рё Р¶РµСЃС‚Р°РјРё С‚СЂРё РЅР°С€РёС… СЃРѕРІРјРµСЃС‚РЅС‹С… РІРѕСЃРїРѕРјРёРЅР°РЅРёСЏ вЂ” РїР°СЂС‚РЅС‘СЂ СѓРіР°РґС‹РІР°РµС‚.",
    "РЎРґРµР»Р°Р№ РїР°СЂС‚РЅС‘СЂСѓ С‚СЂС‘С…РјРёРЅСѓС‚РЅС‹Р№ РјР°СЃСЃР°Р¶ РїР»РµС‡.",
    "РџСЂРёРґСѓРјР°Р№ Рё СЂР°СЃСЃРєР°Р¶Рё СЃРјРµС€РЅСѓСЋ РёСЃС‚РѕСЂРёСЋ, РІ РєРѕС‚РѕСЂРѕР№ РјС‹ РіР»Р°РІРЅС‹Рµ РіРµСЂРѕРё.",
    "РЎРїРѕР№ СЃРµСЂРµРЅР°РґСѓ РїР°СЂС‚РЅС‘СЂСѓ РёР· Р»СЋР±С‹С… С‚СЂС‘С… СЃС‚СЂРѕС‡РµРє.",
    "РќР°СЂРёСЃСѓР№ РїР°СЂС‚РЅС‘СЂР° СЃ Р·Р°РєСЂС‹С‚С‹РјРё РіР»Р°Р·Р°РјРё Р·Р° 30 СЃРµРєСѓРЅРґ.",
    "РЎРєР°Р¶Рё С‚СЂРё РІРµС‰Рё, РєРѕС‚РѕСЂС‹Рµ С‚С‹ РЅРёРєРѕРіРґР° РЅРµ РіРѕРІРѕСЂРёР» РІСЃР»СѓС…, РЅРѕ РґСѓРјР°Р».",
    "РџРѕРІС‚РѕСЂРё РїРѕСЃР»РµРґРЅРµРµ, С‡С‚Рѕ СЃРєР°Р·Р°Р» РїР°СЂС‚РЅС‘СЂ, РјР°РєСЃРёРјР°Р»СЊРЅРѕ СЃРјРµС€РЅС‹Рј РіРѕР»РѕСЃРѕРј.",
    "РџСЂРёРґСѓРјР°Р№ РґР»СЏ РЅР°СЃ РґРІРѕРёС… РїСЂРѕР·РІРёС‰Рµ-РєРѕРјР°РЅРґСѓ Рё РѕР±СЉСЏСЃРЅРё РїРѕС‡РµРјСѓ.",
    "РћС‚РїСЂР°РІСЊ РјР°РјРµ СЃРѕРѕР±С‰РµРЅРёРµ: В«РџСЂРёРІРµС‚, Сѓ РјРµРЅСЏ РІСЃС‘ С…РѕСЂРѕС€Рѕ!В» РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ.",
    "Р Р°СЃСЃРєР°Р¶Рё РїР°СЂС‚РЅС‘СЂСѓ, РєР°РєСѓСЋ СЃСѓРїРµСЂСЃРёР»Сѓ С‚С‹ Р±С‹ РІС‹Р±СЂР°Р» РґР»СЏ РЅР°С€РµР№ РїР°СЂС‹ вЂ” Рё Р·Р°С‡РµРј.",
    "РџРѕРєР°Р¶Рё РїР°СЂС‚РЅС‘СЂСѓ С‚СЂРё С„РѕС‚Рѕ РёР· С‚РµР»РµС„РѕРЅР° РЅР°СѓРіР°Рґ Рё СЂР°СЃСЃРєР°Р¶Рё РёСЃС‚РѕСЂРёСЋ РєР°Р¶РґРѕРіРѕ.",
    "РЎС‚Р°РЅС†СѓР№ 20 СЃРµРєСѓРЅРґ РїРѕРґ Р»СЋР±СѓСЋ РїРµСЃРЅСЋ Р±РµР· РјСѓР·С‹РєРё вЂ” С‚РѕР»СЊРєРѕ РІ РіРѕР»РѕРІРµ.",
    "РЈРіР°РґР°Р№, Рѕ С‡С‘Рј РґСѓРјР°РµС‚ РїР°СЂС‚РЅС‘СЂ РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ. РћРґРЅР° РїРѕРїС‹С‚РєР°.",
];

const WOULD_YOU_RATHER: [string, string][] = [
    ["Р–РёС‚СЊ РіРѕРґ Р±РµР· РјСѓР·С‹РєРё", "Р–РёС‚СЊ РіРѕРґ Р±РµР· СЃРµСЂРёР°Р»РѕРІ"],
    ["Р’РёРґРµС‚СЊ Р±СѓРґСѓС‰РµРµ РЅР° 5 РјРёРЅСѓС‚ РІРїРµСЂС‘Рґ", "РР·РјРµРЅРёС‚СЊ Р»СЋР±РѕРµ РїСЂРѕС€Р»РѕРµ СЃРѕР±С‹С‚РёРµ"],
    ["РџСѓС‚РµС€РµСЃС‚РІРѕРІР°С‚СЊ 3 РјРµСЃСЏС†Р° Р±РµР· С‚РµР»РµС„РѕРЅР°", "Р“РѕРґ РґРѕРјР° СЃ Р»СЋР±С‹Рј РєРѕРјС„РѕСЂС‚РѕРј"],
    ["РЎСЉРµСЃС‚СЊ РѕРґРЅРѕ Р»СЋР±РёРјРѕРµ Р±Р»СЋРґРѕ РґРѕ РєРѕРЅС†Р° Р¶РёР·РЅРё", "РџРёС‚Р°С‚СЊСЃСЏ СЂР°Р·РЅРѕРѕР±СЂР°Р·РЅРѕ, РЅРѕ Р±РµР· Р»СЋР±РёРјРѕРіРѕ"],
    ["Р—РЅР°С‚СЊ, С‡С‚Рѕ РґСѓРјР°РµС‚ РїР°СЂС‚РЅС‘СЂ РІ Р»СЋР±РѕР№ РјРѕРјРµРЅС‚", "РћРЅ/РѕРЅР° Р·РЅР°РµС‚ С‡С‚Рѕ РґСѓРјР°РµС€СЊ С‚С‹"],
    ["РџРµСЂРІС‹Рј РїСЂРёР·РЅР°С‚СЊСЃСЏ РІ Р»СЋР±РІРё", "РќРёРєРѕРіРґР° РЅРµ РїСЂРёР·РЅР°РІР°С‚СЊСЃСЏ Рё Р¶РґР°С‚СЊ"],
    ["Р‘РµСЃРєРѕРЅРµС‡РЅС‹Рµ РґРµРЅСЊРіРё, РЅРѕ РЅРµС‚ РІСЂРµРјРµРЅРё", "Р‘РµСЃРєРѕРЅРµС‡РЅРѕРµ РІСЂРµРјСЏ, РЅРѕ РЅРµС‚ РґРµРЅРµРі"],
    ["Р’РµС‡РЅР°СЏ РјРѕР»РѕРґРѕСЃС‚СЊ, РЅРѕ РѕРґРёРЅ", "РЎС‚Р°СЂРµС‚СЊ РІРјРµСЃС‚Рµ СЃ РїР°СЂС‚РЅС‘СЂРѕРј"],
    ["РџРѕРјРЅРёС‚СЊ РєР°Р¶РґС‹Р№ СЃРѕРЅ РІ РґРµС‚Р°Р»СЏС…", "Р—Р°Р±С‹РІР°С‚СЊ СЃРЅС‹ СЃСЂР°Р·Сѓ РїРѕСЃР»Рµ РїСЂРѕР±СѓР¶РґРµРЅРёСЏ"],
    ["Р–РёС‚СЊ РІ Р±РѕР»СЊС€РѕРј С€СѓРјРЅРѕРј РіРѕСЂРѕРґРµ", "Р–РёС‚СЊ РІ С‚РёС…РѕР№ РґРµСЂРµРІРЅРµ Сѓ РјРѕСЂСЏ"],
];

const DISCUSS_TOPICS = [
    "Р•СЃР»Рё Р±С‹ Сѓ РЅР°СЃ Р±С‹Р» РіРѕРґ Р±РµР· СЂР°Р±РѕС‚С‹ Рё РґРµРЅРµРі РІ РґРѕСЃС‚Р°С‚РєРµ вЂ” С‡С‚Рѕ Р±С‹ РјС‹ РґРµР»Р°Р»Рё?",
    "РљР°РєРёРµ С‚СЂР°РґРёС†РёРё С…РѕС‚РёРј СЃРѕР·РґР°С‚СЊ РІ СЃРІРѕРµР№ СЃРµРјСЊРµ?",
    "Р’ С‡С‘Рј РјС‹ РїРѕС…РѕР¶Рё Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ вЂ” Рё РЅРµ Р·Р°РјРµС‡Р°РµРј СЌС‚РѕРіРѕ?",
    "РљР°Рє РјС‹ РїСЂРµРґСЃС‚Р°РІР»СЏРµРј СЃРІРѕСЋ Р¶РёР·РЅСЊ С‡РµСЂРµР· 10 Р»РµС‚?",
    "Р§С‚Рѕ РґР»СЏ РЅР°СЃ Р·РЅР°С‡РёС‚ В«СЃС‡Р°СЃС‚Р»РёРІС‹Рµ РѕС‚РЅРѕС€РµРЅРёСЏВ» вЂ” РєРѕРЅРєСЂРµС‚РЅРѕ, РІ РґРµС‚Р°Р»СЏС…?",
    "РљР°РєРёРµ С†РµРЅРЅРѕСЃС‚Рё РјС‹ С…РѕС‚РёРј РїРµСЂРµРґР°С‚СЊ РЅР°С€РёРј РґРµС‚СЏРј?",
    "Р§С‚Рѕ Р±С‹ РјС‹ С…РѕС‚РµР»Рё РёР·РјРµРЅРёС‚СЊ РІ РЅР°С€РµРј Р±С‹С‚Сѓ РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ?",
    "РљР°РєРѕРµ РЅР°С€Рµ СЃРѕРІРјРµСЃС‚РЅРѕРµ РґРѕСЃС‚РёР¶РµРЅРёРµ РЅР°СЃ РіРѕСЂРґРёС‚ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ?",
    "Р§С‚Рѕ РЅР°СЃ РѕР±СЉРµРґРёРЅСЏРµС‚, РєСЂРѕРјРµ Р»СЋР±РІРё?",
    "Р•СЃР»Рё Р±С‹ РјС‹ РїРёСЃР°Р»Рё РєРЅРёРіСѓ Рѕ РЅР°С€РёС… РѕС‚РЅРѕС€РµРЅРёСЏС… вЂ” РєР°Рє Р±С‹ РѕРЅР° РЅР°Р·С‹РІР°Р»Р°СЃСЊ Рё С‡РµРјСѓ Р±С‹Р»Р° Р±С‹ РїРѕСЃРІСЏС‰РµРЅР°?",
];

const HOT_QUESTIONS = [
    "Р§С‚Рѕ РёРјРµРЅРЅРѕ РІ РјРѕРµР№ РІРЅРµС€РЅРѕСЃС‚Рё РїСЂРёРІР»РµРєР°РµС‚ С‚РµР±СЏ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ?",
    "РљР°РєРѕР№ РїРѕС†РµР»СѓР№ С‚С‹ Р·Р°РїРѕРјРЅРёР» Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ вЂ” Рё Р·Р° С‡С‚Рѕ?",
    "РћРїРёС€Рё СЃРІРѕРёРјРё СЃР»РѕРІР°РјРё РёРґРµР°Р»СЊРЅС‹Р№ СЂРѕРјР°РЅС‚РёС‡РµСЃРєРёР№ РІРµС‡РµСЂ СЃРѕ РјРЅРѕР№.",
    "Р§С‚Рѕ С‚С‹ РґСѓРјР°РµС€СЊ, РіР»СЏРґСЏ РЅР° РјРµРЅСЏ, РЅРѕ РЅРёРєРѕРіРґР° РЅРµ РіРѕРІРѕСЂРёС€СЊ РІСЃР»СѓС…?",
    "РљР°РєРѕРµ РїСЂРёРєРѕСЃРЅРѕРІРµРЅРёРµ СЃ РјРѕРµР№ СЃС‚РѕСЂРѕРЅС‹ С‚РµР±Рµ РЅСЂР°РІРёС‚СЃСЏ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ?",
    "Р•СЃР»Рё Р±С‹ РјС‹ Р±С‹Р»Рё РЅР°РµРґРёРЅРµ Р±РµР· РїР»Р°РЅРѕРІ РЅР° РІРµСЃСЊ РґРµРЅСЊ вЂ” С‡РµРј Р±С‹ С‚С‹ С…РѕС‚РµР» Р·Р°РЅСЏС‚СЊСЃСЏ?",
    "Р§С‚Рѕ РјРµРЅСЏ РґРµР»Р°РµС‚ РѕСЃРѕР±РµРЅРЅС‹Рј(РѕР№) РІ С‚РІРѕРёС… РіР»Р°Р·Р°С… вЂ” С„РёР·РёС‡РµСЃРєРё?",
    "РљР°Рє С‚С‹ РїРѕРЅРёРјР°РµС€СЊ, С‡С‚Рѕ СЏ С‚РµР±СЏ С…РѕС‡Сѓ?",
    "Р§С‚Рѕ Р±С‹Р»Рѕ СЃР°РјС‹Рј РіРѕСЂСЏС‡РёРј РјРѕРјРµРЅС‚РѕРј РјРµР¶РґСѓ РЅР°РјРё?",
    "РљР°РєРѕР№ РєРѕРјРїР»РёРјРµРЅС‚ РѕС‚ РјРµРЅСЏ С‚РµР±СЏ СЂР°Р·Р¶РёРіР°РµС‚ СЃРёР»СЊРЅРµРµ РІСЃРµРіРѕ?",
    "Р§С‚Рѕ С‚С‹ С…РѕС‡РµС€СЊ, С‡С‚РѕР±С‹ СЏ РґРµР»Р°Р»(Р°) С‡Р°С‰Рµ?",
    "Р•СЃР»Рё Р±С‹ СЏ РјРѕРі(Р»Р°) РїСЂРѕС‡РёС‚Р°С‚СЊ С‚РІРѕРё РјС‹СЃР»Рё РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ вЂ” С‡С‚Рѕ Р±С‹ СЏ СѓРІРёРґРµР»(Р°)?",
    "РљР°РєРѕРµ РјРµСЃС‚Рѕ РЅР° РјРѕС‘Рј С‚РµР»Рµ С‚РµР±Рµ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ РЅСЂР°РІРёС‚СЃСЏ?",
    "Р§С‚Рѕ С‚С‹ С‡СѓРІСЃС‚РІСѓРµС€СЊ, РєРѕРіРґР° СЏ С‚РµР±СЏ РѕР±РЅРёРјР°СЋ?",
];

const HOT_DARES = [
    "РЎРјРѕС‚СЂРё РїР°СЂС‚РЅС‘СЂСѓ РІ РіР»Р°Р·Р° 60 СЃРµРєСѓРЅРґ РЅРµ РѕС‚РІР»РµРєР°СЏСЃСЊ Рё РЅРµ СЃРјРµСЏСЃСЊ.",
    "РЎРєР°Р¶Рё РїР°СЂС‚РЅС‘СЂСѓ С‚СЂРё СЃР°РјС‹С… РіРѕСЂСЏС‡РёС… РєРѕРјРїР»РёРјРµРЅС‚Р°, РєРѕС‚РѕСЂС‹Рµ РјРѕР¶РµС€СЊ РїСЂРёРґСѓРјР°С‚СЊ.",
    "РЎРґРµР»Р°Р№ РїР°СЂС‚РЅС‘СЂСѓ РјРµРґР»РµРЅРЅС‹Р№ РјР°СЃСЃР°Р¶ С€РµРё Рё РїР»РµС‡ вЂ” 5 РјРёРЅСѓС‚.",
    "РќР°РїРёС€Рё РїР°СЂС‚РЅС‘СЂСѓ РіРѕР»РѕСЃРѕРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ СЃ Р»СЋР±РѕРІРЅС‹Рј РїСЂРёР·РЅР°РЅРёРµРј.",
    "РџРѕС†РµР»СѓР№ РїР°СЂС‚РЅС‘СЂР° РІ С€РµСЋ СЂРѕРІРЅРѕ 10 СЃРµРєСѓРЅРґ.",
    "РЁС‘РїРѕС‚РѕРј СЃРєР°Р¶Рё РїР°СЂС‚РЅС‘СЂСѓ, С‡С‚Рѕ С‚С‹ Рѕ РЅС‘Рј РґСѓРјР°РµС€СЊ РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ.",
    "РџРѕРіР»Р°РґСЊ СЂСѓРєСѓ РїР°СЂС‚РЅС‘СЂР° Рё СЂР°СЃСЃРєР°Р¶Рё С‡С‚Рѕ С‡СѓРІСЃС‚РІСѓРµС€СЊ РїСЂРё РїСЂРёРєРѕСЃРЅРѕРІРµРЅРёРё.",
    "РџСЂРёРґСѓРјР°Р№ РїР°СЂС‚РЅС‘СЂСѓ РїРёРєР°РЅС‚РЅРѕРµ РїСЂРѕР·РІРёС‰Рµ Рё РѕР±СЉСЏСЃРЅРё РїРѕС‡РµРјСѓ.",
    "Р—Р°РєСЂРѕР№ РіР»Р°Р·Р°, РїР°СЂС‚РЅС‘СЂ РєР°СЃР°РµС‚СЃСЏ С‚РІРѕРµР№ СЂСѓРєРё вЂ” СѓРіР°РґР°Р№ РєР°Р¶РґРѕРµ РїСЂРёРєРѕСЃРЅРѕРІРµРЅРёРµ.",
    "РќР°РїРёС€Рё РїР°СЂС‚РЅС‘СЂСѓ РѕРґРЅРѕ Р¶РµР»Р°РЅРёРµ, РєРѕС‚РѕСЂРѕРµ С…РѕС‡РµС€СЊ РёСЃРїРѕР»РЅРёС‚СЊ РІРјРµСЃС‚Рµ.",
    "РћР±РЅРёРјРё РїР°СЂС‚РЅС‘СЂР° СЃР·Р°РґРё Рё РґРµСЂР¶Рё С‚Р°Рє 30 СЃРµРєСѓРЅРґ РјРѕР»С‡Р°.",
    "РЎРєР°Р¶Рё РїР°СЂС‚РЅС‘СЂСѓ РѕРґРЅСѓ РІРµС‰СЊ, РєРѕС‚РѕСЂСѓСЋ С‚С‹ СЃС‚РµСЃРЅСЏРµС€СЊСЃСЏ РіРѕРІРѕСЂРёС‚СЊ РІСЃР»СѓС….",
];

type SpicyGameMode = 'truth' | 'dare' | 'rather' | 'discuss' | 'hot' | 'hot-dare';
type CardGameItem = string | [string, string];

function normalizeSpicyItems(items: unknown[], mode: SpicyGameMode): CardGameItem[] {
    if (mode === 'rather') {
        return items
            .filter((item): item is [string, string] => Array.isArray(item)
                && item.length >= 2
                && typeof item[0] === 'string'
                && typeof item[1] === 'string')
            .map(([a, b]) => [a, b] as [string, string]);
    }

    return items.filter((item): item is string => typeof item === 'string');
}

function CardGame({
    title,
    emoji,
    color,
    initialItems,
    renderItem,
    onBack,
    aiMode,
}: {
    title: string;
    emoji: string;
    color: string;
    initialItems: CardGameItem[];
    renderItem: (item: CardGameItem, i: number) => React.ReactNode;
    onBack: () => void;
    aiMode: SpicyGameMode;
}) {
    const [items, setItems] = useState<CardGameItem[]>(initialItems);
    const [index, setIndex] = useState(0);
    const [done, setDone] = useState<number[]>([]);
    const [finished, setFinished] = useState(false);
    const [generating, setGenerating] = useState(false);

    const current = items[index];
    const remaining = items.map((_, i) => i).filter(i => !done.includes(i) && i !== index);

    const next = () => {
        hapticFeedback.medium();
        if (remaining.length === 0) {
            // All done вЂ” show AI generation screen
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setFinished(true);
        } else {
            const nextIdx = remaining[Math.floor(Math.random() * remaining.length)];
            setDone(prev => [...prev, index]);
            setIndex(nextIdx);
        }
    };

    const loadAI = async () => {
        setGenerating(true);
        hapticFeedback.medium();
        try {
            const res = await fetch('/api/spicy-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: aiMode, count: 10 }),
            });
            const data = await res.json() as { items?: unknown[] };
            const generatedItems = Array.isArray(data.items) ? normalizeSpicyItems(data.items, aiMode) : [];
            if (generatedItems.length > 0) {
                const startIdx = items.length;
                setItems(prev => [...prev, ...generatedItems]);
                setDone([]);
                setIndex(startIdx);
                setFinished(false);
                hapticFeedback.success();
            }
        } catch {
            // fallback: just restart with original items
            setDone([]);
            setIndex(0);
            setFinished(false);
        } finally {
            setGenerating(false);
        }
    };

    const restart = () => {
        setDone([]);
        setIndex(0);
        setFinished(false);
        hapticFeedback.light();
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center px-5 pt-10 pb-28">
            <header className="w-full flex items-center gap-3 mb-8">
                <BackButton onClick={onBack} />
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{emoji} {title}</h1>
                <span className="ml-auto text-xs font-bold opacity-40" style={{ color: 'var(--text)' }}>
                    {done.length + 1}/{items.length}
                </span>
            </header>

            {/* Progress bar */}
            <div className="w-full max-w-sm h-1.5 rounded-full mb-6" style={{ background: 'var(--bg-muted)' }}>
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${((done.length + 1) / items.length) * 100}%`, background: color }}
                />
            </div>

            {/* Card */}
            <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center gap-6">
                {finished ? (
                    /* в”Ђв”Ђ All done screen в”Ђв”Ђ */
                    <div className="flex flex-col items-center gap-6 text-center w-full">
                        <span className="text-6xl animate-bounce">рџЋ‰</span>
                        <div>
                            <p className="text-xl font-extrabold mb-1" style={{ color: 'var(--text)' }}>
                                Р’СЃС‘ РїСЂРѕС€Р»Рё!
                            </p>
                            <p className="text-sm opacity-50 font-medium" style={{ color: 'var(--text)' }}>
                                {done.length + 1} РєР°СЂС‚РѕС‡РµРє РїРѕР·Р°РґРё
                            </p>
                        </div>

                        {/* AI generate button */}
                        <button
                            onClick={loadAI}
                            disabled={generating}
                            className="w-full max-w-sm py-4 rounded-2xl font-extrabold text-white text-base active:scale-95 transition-all shadow-lg relative overflow-hidden"
                            style={{
                                background: generating
                                    ? '#aaa'
                                    : `linear-gradient(135deg, ${color}, ${color}cc)`,
                                boxShadow: generating ? 'none' : `0 0 24px ${color}66`,
                            }}
                        >
                            {generating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">вљ™пёЏ</span> Р“РµРЅРµСЂРёСЂСѓСЋ...
                                </span>
                            ) : (
                                'вњЁ РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ РµС‰С‘ (AI)'
                            )}
                        </button>

                        <button
                            onClick={restart}
                            className="text-sm font-bold opacity-40 hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--text)' }}
                        >
                            рџ”„ РќР°С‡Р°С‚СЊ Р·Р°РЅРѕРІРѕ
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="w-full rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col items-center gap-5 text-center min-h-[220px] justify-center"
                            style={{ background: 'var(--bg-card)', border: `2px solid ${color}22` }}
                        >
                            <span className="text-5xl">{emoji}</span>
                            {renderItem(current, index)}
                        </div>

                        <button
                            onClick={next}
                            className="w-full max-w-sm py-4 rounded-2xl font-extrabold text-white text-base active:scale-95 transition-all shadow-lg"
                            style={{ background: color }}
                        >
                            {remaining.length === 0 ? 'рџЏЃ Р—Р°РєРѕРЅС‡РёС‚СЊ' : 'РЎР»РµРґСѓСЋС‰РёР№ в†’'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* в”Ђв”Ђв”Ђ Page в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

export default function SpicyPage() {
    const [mode, setMode] = useState<'home' | 'truth' | 'dare' | 'rather' | 'discuss' | 'hot' | 'hot-dare'>('home');
    const [ratherChoice, setRatherChoice] = useState<0 | 1 | null>(null);

    if (mode === 'truth') {
        return (
            <CardGame
                title="РџСЂР°РІРґР°"
                emoji="рџ’¬"
                color="#8b5cf6"
                initialItems={TRUTH_QUESTIONS}
                aiMode="truth"
                renderItem={(q) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>
                        {typeof q === 'string' ? q : q.join(' / ')}
                    </p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'dare') {
        return (
            <CardGame
                title="Р”РµР№СЃС‚РІРёРµ"
                emoji="рџЋЇ"
                color="#e07a5f"
                initialItems={DARE_CHALLENGES}
                aiMode="dare"
                renderItem={(c) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>
                        {typeof c === 'string' ? c : c.join(' / ')}
                    </p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'rather') {
        return (
            <CardGame
                title="Р§С‚Рѕ Р»СѓС‡С€Рµ?"
                emoji="вљЎ"
                color="#f59e0b"
                initialItems={WOULD_YOU_RATHER}
                aiMode="rather"
                renderItem={(item) => {
                    const [a, b] = Array.isArray(item) ? item : [String(item), ''];
                    return (
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => { hapticFeedback.light(); setRatherChoice(0); }}
                                className={`w-full p-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${ratherChoice === 0 ? 'text-white shadow-md' : 'opacity-80'}`}
                                style={{
                                    background: ratherChoice === 0 ? '#f59e0b' : 'var(--bg-muted)',
                                    color: ratherChoice === 0 ? 'white' : 'var(--text)',
                                }}
                            >
                                {a}
                            </button>
                            <div className="text-sm font-black opacity-30" style={{ color: 'var(--text)' }}>РР›Р</div>
                            <button
                                onClick={() => { hapticFeedback.light(); setRatherChoice(1); }}
                                className="w-full p-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                                style={{
                                    background: ratherChoice === 1 ? '#f59e0b' : 'var(--bg-muted)',
                                    color: ratherChoice === 1 ? 'white' : 'var(--text)',
                                }}
                            >
                                {b}
                            </button>
                        </div>
                    );
                }}
                onBack={() => { setMode('home'); setRatherChoice(null); }}
            />
        );
    }

    if (mode === 'discuss') {
        return (
            <CardGame
                title="РџРѕРіРѕРІРѕСЂРёРј"
                emoji="рџ«‚"
                color="#10b981"
                initialItems={DISCUSS_TOPICS}
                aiMode="discuss"
                renderItem={(t) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>
                        {typeof t === 'string' ? t : t.join(' / ')}
                    </p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'hot') {
        return (
            <CardGame
                title="Р“РѕСЂСЏС‡РёРµ РІРѕРїСЂРѕСЃС‹"
                emoji="рџЊ¶пёЏ"
                color="#ec4899"
                initialItems={HOT_QUESTIONS}
                aiMode="hot"
                renderItem={(q) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>
                        {typeof q === 'string' ? q : q.join(' / ')}
                    </p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    if (mode === 'hot-dare') {
        return (
            <CardGame
                title="Р“РѕСЂСЏС‡РёРµ Р·Р°РґР°РЅРёСЏ"
                emoji="рџ’‹"
                color="#f43f5e"
                initialItems={HOT_DARES}
                aiMode="hot-dare"
                renderItem={(c) => (
                    <p className="text-lg font-bold leading-snug" style={{ color: 'var(--text)' }}>
                        {typeof c === 'string' ? c : c.join(' / ')}
                    </p>
                )}
                onBack={() => setMode('home')}
            />
        );
    }

    /* в”Ђв”Ђ Home в”Ђв”Ђ */
    return (
        <main className="w-full min-h-[100dvh] flex flex-col items-center px-6 pt-12 pb-32">
            <header className="w-full flex justify-between items-center mb-2">
                <BackButton href="/" />
                <div className="w-8" />
            </header>

            {/* Hero */}
            <div className="flex flex-col items-center gap-2 mb-10 text-center">
                <span className="text-6xl drop-shadow-md">рџ”Ґ</span>
                <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Р”Р»СЏ РґРІРѕРёС…</h1>
                <p className="text-sm opacity-50 font-bold max-w-[240px]" style={{ color: 'var(--text)' }}>
                    РРіСЂС‹, РІРѕРїСЂРѕСЃС‹ Рё С‚РµРјС‹ РґР»СЏ РЅР°СЃС‚РѕСЏС‰РµРіРѕ РІРµС‡РµСЂР° РІРґРІРѕС‘Рј
                </p>
            </div>

            {/* Game cards */}
            <div className="w-full max-w-sm flex flex-col gap-3">

                {/* Truth */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('truth'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.15)]"
                    style={{ background: '#f5f0ff', border: '2px solid #8b5cf622' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#8b5cf6' }}>рџ’¬</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#4c1d95' }}>РџСЂР°РІРґР°</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#4c1d95' }}>
                            {TRUTH_QUESTIONS.length} РІРѕРїСЂРѕСЃРѕРІ Рѕ РІР°СЃ РѕР±РѕРёС…
                        </p>
                    </div>
                    <span className="text-xl opacity-30">вЂє</span>
                </button>

                {/* Dare */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('dare'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(224,122,95,0.15)]"
                    style={{ background: '#fff4f0', border: '2px solid #e07a5f22' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#e07a5f' }}>рџЋЇ</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#7c2d12' }}>Р”РµР№СЃС‚РІРёРµ</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#7c2d12' }}>
                            {DARE_CHALLENGES.length} Р·Р°РґР°РЅРёР№ РґР»СЏ СЃРјРµР»С‹С…
                        </p>
                    </div>
                    <span className="text-xl opacity-30">вЂє</span>
                </button>

                {/* Would you rather */}
                <button
                    onClick={() => { hapticFeedback.medium(); setRatherChoice(null); setMode('rather'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                    style={{ background: '#fffbeb', border: '2px solid #f59e0b22' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#f59e0b' }}>вљЎ</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#78350f' }}>Р§С‚Рѕ Р»СѓС‡С€Рµ?</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#78350f' }}>
                            {WOULD_YOU_RATHER.length} РґРёР»РµРјРј вЂ” РІС‹Р±РµСЂРё Рё РѕР±СЉСЏСЃРЅРё
                        </p>
                    </div>
                    <span className="text-xl opacity-30">вЂє</span>
                </button>

                {/* Deep talks */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('discuss'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                    style={{ background: '#f0fdf9', border: '2px solid #10b98122' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: '#10b981' }}>рџ«‚</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#065f46' }}>РџРѕРіРѕРІРѕСЂРёРј</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#065f46' }}>
                            {DISCUSS_TOPICS.length} РіР»СѓР±РѕРєРёС… С‚РµРј РґР»СЏ СЂР°Р·РіРѕРІРѕСЂР°
                        </p>
                    </div>
                    <span className="text-xl opacity-30">вЂє</span>
                </button>

                {/* Hot questions */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('hot'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(236,72,153,0.2)]"
                    style={{ background: 'linear-gradient(135deg, #fdf2f8, #fff0f5)', border: '2px solid #ec489922' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>рџЊ¶пёЏ</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#831843' }}>Р“РѕСЂСЏС‡РёРµ РІРѕРїСЂРѕСЃС‹</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#831843' }}>
                            {HOT_QUESTIONS.length} РёРЅС‚РёРјРЅС‹С… РІРѕРїСЂРѕСЃРѕРІ РґР»СЏ РґРІРѕРёС… рџ”Ґ
                        </p>
                    </div>
                    <span className="text-xl opacity-30">вЂє</span>
                </button>

                {/* Hot dares */}
                <button
                    onClick={() => { hapticFeedback.medium(); setMode('hot-dare'); }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 active:scale-95 transition-all shadow-[0_4px_20px_rgba(244,63,94,0.2)]"
                    style={{ background: 'linear-gradient(135deg, #fff1f2, #fce7f3)', border: '2px solid #f43f5e22' }}
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}>рџ’‹</div>
                    <div className="text-left flex-1">
                        <h2 className="font-extrabold text-base" style={{ color: '#881337' }}>Р“РѕСЂСЏС‡РёРµ Р·Р°РґР°РЅРёСЏ</h2>
                        <p className="text-xs opacity-60 mt-0.5" style={{ color: '#881337' }}>
                            {HOT_DARES.length} С‡СѓРІСЃС‚РІРµРЅРЅС‹С… Р·Р°РґР°РЅРёР№
                        </p>
                    </div>
                    <span className="text-xl opacity-30">вЂє</span>
                </button>

            </div>

            <p className="mt-8 text-xs opacity-30 text-center font-bold" style={{ color: 'var(--text)' }}>
                РўРѕР»СЊРєРѕ РґР»СЏ РґРІРѕРёС… рџ”ђ
            </p>
        </main>
    );
}

