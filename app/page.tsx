"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function HomePage() {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState("");
  const [explanation, setExplanation] = useState(""); 
  const [isCopied, setIsCopied] = useState(false);
  
  const [history, setHistory] = useState<Array<{original: string, formatted: string, explanation: string, date: string}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('apa-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleCheck = async () => {
    if (!text.trim()) {
      setResult("⚠️ กรุณาวางข้อความบรรณานุกรมที่ต้องการตรวจสอบก่อนครับ");
      return;
    }

    setIsChecking(true);
    setResult("");
    setExplanation("");
    setIsCopied(false);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดบางอย่าง');
      }

      let finalResult = data.result;
      let finalExplanation = "";
      
      if (data.result.includes('|||')) {
        const parts = data.result.split('|||');
        finalResult = parts[0].trim().replace(/\n+/g, '\n\n');
        finalExplanation = parts[1].trim();
      } else {
        finalResult = finalResult.trim().replace(/\n+/g, '\n\n');
      }

      setResult(finalResult);
      setExplanation(finalExplanation);

      const newHistoryItem = { 
        original: text, 
        formatted: finalResult, 
        explanation: finalExplanation,
        date: new Date().toLocaleString('th-TH') 
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('apa-history', JSON.stringify(updatedHistory));

    } catch (error: any) {
      console.error(error);
      setResult(`⚠️ ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult("");
    setExplanation("");
    setIsCopied(false);
  };

  const handleCopyText = () => {
    const resultElement = document.getElementById("formatted-result");
    if (resultElement) {
      const range = document.createRange();
      range.selectNodeContents(resultElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      document.execCommand('copy');
      
      selection?.removeAllRanges();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    }
  };

  const clearHistory = () => {
    if(confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการแก้ไขทั้งหมด?')) {
      setHistory([]);
      localStorage.removeItem('apa-history');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F1] text-gray-800 font-sans pb-12">
      <nav className="bg-white shadow-sm border-b border-[#EBE3D5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-lg md:text-xl tracking-tight text-amber-900">
                JETC : Journal of Educational Technology & Communications
              </span>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6">
              <button 
                onClick={() => setShowHelp(true)}
                className="text-amber-800 hover:text-amber-950 font-bold flex items-center transition-colors text-sm sm:text-base"
              >
                📖 วิธีใช้งาน
              </button>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-700 hover:text-amber-900 font-medium flex items-center transition-colors text-sm sm:text-base"
              >
                🕒 ประวัติ {history.length > 0 && `(${history.length})`}
              </button>
            </div>
            
          </div>
        </div>
      </nav>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-fade-in-up relative max-h-[90vh] overflow-y-auto border border-[#EBE3D5]">
            <button 
              onClick={() => setShowHelp(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-amber-900 mb-6 border-b border-[#EBE3D5] pb-3 flex items-center">
              <span className="mr-2">📖</span> คู่มือการใช้งานระบบ
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p><strong>1. วางข้อมูลบรรณานุกรม:</strong> คัดลอกรายการบรรณานุกรมที่คุณมี (ทั้งภาษาไทยและอังกฤษรวมกันได้) มาวางในกล่องข้อความ</p>
              <p><strong>2. กดปุ่มจัดรูปแบบ:</strong> คลิกปุ่ม <span className="text-amber-800 font-bold">"✨ คลิกตรวจข้อมูล"</span> แล้วรอระบบ AI ประมวลผลและตรวจสอบความถูกต้องประมาณ 30 วินาที - 1 นาที</p>
              <p><strong>3. ตรวจสอบผลลัพธ์:</strong> ระบบจะจัดกลุ่มภาษาไทยขึ้นก่อนภาษาอังกฤษ จัดเรียงตามลำดับตัวอักษร และทำตัวเอียงให้อัตโนมัติตามหลักการ APA 7th Edition</p>
              <p><strong>4. คัดลอกไปใช้งาน:</strong> กดปุ่ม <span className="bg-[#FAF8F1] text-amber-900 border border-[#EBE3D5] px-2 py-1 rounded text-sm font-bold">📋 คัดลอกไปวางใน Word</span> เพื่อนำไปใช้ต่อได้ทันที (ระบบตั้งค่าการย่อหน้าบรรทัดที่สองไว้ให้เบื้องต้นแล้ว)</p>
              
              <div className="mt-6 p-4 bg-[#FDFBF7] border border-[#EBE3D5] rounded-lg text-sm">
                <p className="text-amber-900 font-bold mb-1">💡 คำแนะนำเพิ่มเติม:</p>
                <ul className="list-disc ml-5 space-y-1 text-amber-800">
                  <li>หากวางข้อมูลหลายรายการ แนะนำให้เว้นบรรทัดให้ชัดเจน เพื่อให้ AI แยกแยะได้แม่นยำที่สุด</li>
                  <li>ผู้ใช้ควรตรวจสอบตัวสะกดและเทียบกับ <strong>"คู่มือการทำวิทยานิพนธ์ของมหาวิทยาลัย"</strong> อีกครั้งก่อนนำไปตีพิมพ์จริง</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowHelp(false)}
                className="bg-amber-800 text-white px-8 py-2 rounded-lg font-bold hover:bg-amber-900 transition-colors shadow-sm"
              >
                เข้าใจแล้ว เริ่มใช้งานเลย!
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {showHistory && (
          <div className="bg-white border border-[#EBE3D5] rounded-xl p-6 mb-8 shadow-sm animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-900">ประวัติการตรวจสอบล่าสุด</h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                  🗑️ ล้างประวัติทั้งหมด
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-gray-400 text-center py-4">ยังไม่มีประวัติการแก้ไข</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {history.map((item, index) => (
                  <div key={index} className="bg-white p-5 rounded-lg border border-[#EBE3D5] shadow-sm text-sm">
                    <div className="text-xs text-amber-700 mb-3">{item.date}</div>
                    <div className="mb-3">
                      <strong className="text-amber-900">🔴 ต้นฉบับ:</strong> 
                      <span className="text-gray-600 ml-2 line-clamp-2">{item.original}</span>
                    </div>
                    <div className="mb-3">
                      <strong className="text-amber-900">🟢 ผลลัพธ์:</strong> 
                      <div className="inline-block text-gray-800 font-serif ml-2">
                        <ReactMarkdown>{item.formatted}</ReactMarkdown>
                      </div>
                    </div>
                    
                    {item.explanation && (
                      <div className="mt-3 pt-3 border-t border-[#EBE3D5] bg-[#FDFBF7] rounded p-3">
                        <strong className="text-amber-900 flex items-center mb-2">
                          <span className="mr-1">💡</span> สิ่งที่ AI แก้ไข:
                        </strong>
                        <div className="text-amber-800 ml-6 space-y-1">
                          <ReactMarkdown 
                            components={{
                              ul: ({node, ...props}) => <ul className="list-disc" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />
                            }}
                          >
                            {item.explanation}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 mb-3">
            ระบบตรวจสอบรายการอ้างอิง
          </h1>
          <p className="text-amber-800 text-lg max-w-2xl mx-auto">
            ระบบตรวจสอบรายการอ้างอิง
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-[#EBE3D5]">
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-4 border border-[#EBE3D5] rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-y text-base text-gray-800 bg-white"
            placeholder="วางข้อความบรรณานุกรมที่นี่ (สามารถวางได้หลายรายการ)..."
          ></textarea>

          <div className="mt-6 flex flex-col items-center space-y-3">
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
              <button 
                onClick={handleCheck}
                disabled={isChecking}
                className={`text-white px-8 py-3 rounded-lg font-bold text-lg transition duration-200 shadow-sm flex items-center justify-center
                  ${isChecking ? 'bg-amber-600 cursor-not-allowed' : 'bg-amber-800 hover:bg-amber-900'}`}
              >
                {isChecking ? '⏳ กำลังประมวลผลและตรวจสอบซ้ำ...' : '✨ คลิกตรวจข้อมูล'}
              </button>
              <button 
                onClick={handleClear}
                disabled={isChecking}
                className={`bg-white text-amber-900 border border-[#EBE3D5] px-8 py-3 rounded-lg font-bold text-lg transition duration-200 shadow-sm
                  ${isChecking ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FAF8F1]'}`}
              >
                ล้างข้อความ
              </button>
            </div>
            
            {isChecking && (
              <p className="text-amber-700 text-sm font-medium animate-pulse mt-2 text-center">
                ⚠️ ระบบกำลังจัดรูปแบบและตรวจสอบความถูกต้องซ้ำ กรุณารอประมาณ 30 วินาที - 1 นาทีครับ...
              </p>
            )}
          </div>

          {result && !result.startsWith('⚠️') && (
            <div className="mt-10 animate-fade-in-up">
              
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-amber-900">ผลลัพธ์พร้อมใช้งาน:</h3>
                <button 
                  onClick={handleCopyText}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center shadow-sm
                    ${isCopied ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-white text-amber-900 border border-[#EBE3D5] hover:bg-[#FAF8F1]'}`}
                >
                  {isCopied ? '✅ คัดลอกแล้ว' : '📋 คัดลอกไปวางใน Word'}
                </button>
              </div>
              
              <div 
                id="formatted-result"
                className="bg-white p-6 rounded-lg border border-[#EBE3D5] shadow-sm text-lg leading-relaxed text-black font-serif mb-6"
              >
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => (
                      <p 
                        style={{ 
                          marginLeft: '36pt',
                          textIndent: '-36pt',
                          marginBottom: '12pt',
                          lineHeight: '1.5'
                        }} 
                        {...props} 
                      />
                    )
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>

              {explanation && (
                <div className="mb-6 p-5 bg-[#FDFBF7] border border-[#EBE3D5] rounded-lg shadow-sm">
                  <h4 className="text-md font-bold text-amber-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">💡</span> สรุปสิ่งที่ AI ทำการแก้ไข:
                  </h4>
                  <div className="text-amber-900 font-sans ml-7 space-y-1">
                    <ReactMarkdown 
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />
                      }}
                    >
                      {explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start p-4 bg-[#FDFBF7] border border-[#EBE3D5] rounded-lg text-amber-900 text-sm">
                <span className="text-xl mr-2 text-amber-700">⚠️</span>
                <p>
                  <strong>หมายเหตุ:</strong> ระบบนี้ใช้ AI ในการช่วยจัดรูปแบบ กรุณาตรวจสอบความถูกต้องของข้อมูลและตัวสะกดตาม <strong>"คู่มือการทำวิทยานิพนธ์ของมหาวิทยาลัย"</strong> อีกครั้งก่อนนำไปใช้งานจริง
                </p>
              </div>

            </div>
          )}

          {result && result.startsWith('⚠️') && (
            <div className="mt-8 p-6 rounded-lg border bg-red-50 border-red-200 text-red-800">
              {result}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}