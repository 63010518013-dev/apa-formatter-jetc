import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ไม่พบ API Key ในระบบหลังบ้าน' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'กรุณาส่งข้อความที่ต้องการตรวจสอบมาด้วย' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 💡 อัปเดต Prompt ใหม่ บังคับเว้น 2 บรรทัด และบังคับแบ่ง |||
    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านบรรณานุกรม APA 7th Edition
      กรุณาตรวจสอบและจัดรูปแบบข้อความต่อไปนี้ให้ถูกต้องตามหลัก APA 7th Edition:

      "${text}"
      
      ข้อกำหนดสำคัญ (ต้องทำตามอย่างเคร่งครัด):
      1. ใช้เครื่องหมาย *ข้อความ* สำหรับส่วนที่ต้องเป็นตัวเอียงตามหลัก APA 7
      2. หากมีหลายรายการ ให้คั่นแต่ละรายการด้วยการเว้นบรรทัด 2 ครั้ง (Double newlines) เสมอ เพื่อให้ระบบแสดงผลแยกบรรทัดได้ถูกต้อง
      3. ให้คุณตอบกลับมาโดยแบ่งเนื้อหาเป็น 2 ส่วน คั่นด้วยเครื่องหมาย ||| (ท่อ 3 ขีด) ดังนี้:
      
      ส่วนที่ 1: ผลลัพธ์บรรณานุกรมที่จัดรูปแบบถูกต้องแล้วเท่านั้น (ห้ามมีคำนำหน้าใดๆ)
      |||
      ส่วนที่ 2: คำอธิบายสั้นๆ เป็นข้อๆ (Bullet points) ว่าคุณจัดรูปแบบจุดไหนไปบ้าง 
    `;

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    const generatedText = response.text();

    return NextResponse.json({ result: generatedText.trim() });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI' },
      { status: 500 }
    );
  }
}