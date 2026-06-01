import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { isLocale, type Locale } from '@/lib/i18n'

/**
 * Privacy notice (FR-026, PDPA). Linked from the inquiry form's consent control;
 * it states what personal data the inquiry form collects, why, how long it is kept
 * (24 months, FR-027), and how to request erasure (FR-028). Bilingual EN/TH.
 *
 * Static, self-contained copy (not CMS-managed) — it documents the legally-required
 * data-handling terms rather than editorial marketing content.
 */
export const dynamic = 'force-static'

const COPY: Record<
  Locale,
  {
    title: string
    intro: string
    collectHead: string
    collect: string[]
    whyHead: string
    why: string
    retentionHead: string
    retention: string
    rightsHead: string
    rights: string
    residencyHead: string
    residency: string
    back: string
  }
> = {
  en: {
    title: 'Privacy notice',
    intro:
      'This notice explains how Wrenfield Works handles the personal data you provide through the inquiry form, in line with Thailand’s Personal Data Protection Act (PDPA).',
    collectHead: 'What we collect',
    collect: [
      'Your name',
      'Your email address',
      'The message you send us',
      'The language you were using and the time of submission',
      'A record that you consented to this processing, and when',
    ],
    whyHead: 'Why we collect it',
    why: 'We use these details solely to read and respond to your inquiry. We do not sell your data or use it for advertising, and our website analytics are cookieless and do not identify you.',
    retentionHead: 'How long we keep it',
    retention:
      'We keep an inquiry for no longer than 24 months from submission, after which the entire record is permanently and automatically deleted.',
    rightsHead: 'Your rights',
    rights:
      'You may ask us to access, correct, or delete your data at any time. Email hello@wrenfieldworks.com and we will remove your inquiry from our system.',
    residencyHead: 'Where your data is stored',
    residency:
      'Your data is stored and processed in the Asia-Pacific (Singapore) region, and all data in transit is protected with TLS encryption.',
    back: '← Back to the site',
  },
  th: {
    title: 'นโยบายความเป็นส่วนตัว',
    intro:
      'ประกาศนี้อธิบายวิธีที่ Wrenfield Works จัดการข้อมูลส่วนบุคคลที่คุณให้ผ่านแบบฟอร์มติดต่อ ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของประเทศไทย',
    collectHead: 'ข้อมูลที่เราเก็บ',
    collect: [
      'ชื่อของคุณ',
      'ที่อยู่อีเมลของคุณ',
      'ข้อความที่คุณส่งถึงเรา',
      'ภาษาที่คุณใช้และเวลาที่ส่ง',
      'บันทึกว่าคุณยินยอมให้ประมวลผลข้อมูลนี้ และยินยอมเมื่อใด',
    ],
    whyHead: 'เหตุผลที่เราเก็บ',
    why: 'เราใช้ข้อมูลเหล่านี้เพื่ออ่านและตอบกลับคำขอของคุณเท่านั้น เราไม่ขายข้อมูลของคุณและไม่ใช้เพื่อการโฆษณา และระบบวิเคราะห์เว็บไซต์ของเราไม่ใช้คุกกี้และไม่ระบุตัวตนคุณ',
    retentionHead: 'ระยะเวลาที่เก็บ',
    retention:
      'เราเก็บคำขอติดต่อไม่เกิน 24 เดือนนับจากวันที่ส่ง หลังจากนั้นบันทึกทั้งหมดจะถูกลบอย่างถาวรและอัตโนมัติ',
    rightsHead: 'สิทธิของคุณ',
    rights:
      'คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลของคุณได้ตลอดเวลา ส่งอีเมลถึง hello@wrenfieldworks.com แล้วเราจะลบคำขอของคุณออกจากระบบ',
    residencyHead: 'สถานที่จัดเก็บข้อมูล',
    residency:
      'ข้อมูลของคุณถูกจัดเก็บและประมวลผลในภูมิภาคเอเชียแปซิฟิก (สิงคโปร์) และข้อมูลระหว่างการรับส่งได้รับการปกป้องด้วยการเข้ารหัส TLS',
    back: '← กลับสู่เว็บไซต์',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return { title: `${COPY[locale].title} — Wrenfield Works` }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const c = COPY[raw]

  return (
    <main id="main" className="legal-page">
      <div className="wrap">
        <h1>{c.title}</h1>
        <p className="lead">{c.intro}</p>

        <h2>{c.collectHead}</h2>
        <ul>
          {c.collect.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{c.whyHead}</h2>
        <p>{c.why}</p>

        <h2>{c.retentionHead}</h2>
        <p>{c.retention}</p>

        <h2>{c.rightsHead}</h2>
        <p>{c.rights}</p>

        <h2>{c.residencyHead}</h2>
        <p>{c.residency}</p>

        <p className="legal-back">
          <Link href={`/${raw}`}>{c.back}</Link>
        </p>
      </div>
    </main>
  )
}
