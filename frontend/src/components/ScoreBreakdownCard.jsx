import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Award, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function ScoreBreakdownCard({ breakdownData, lang = 'en' }) {
  const [expandedSubScore, setExpandedSubScore] = useState(null);

  if (!breakdownData || !breakdownData.scoreBreakdown) {
    return (
      <div className="text-gray-400 text-xs italic">
        {lang === 'th' ? 'ไม่มีการประเมินคะแนนแยกแยะ' : 'Score breakdown data unavailable.'}
      </div>
    );
  }

  const { overallScore, scoreBreakdown } = breakdownData;

  const categories = [
    {
      key: 'starStructure',
      label: lang === 'th' ? 'โครงสร้างคำตอบ (STAR)' : 'STAR Structure',
      description: lang === 'th' ? 'การเรียงร้อยสถานการณ์ (S), งาน (T), การกระทำ (A), และผลลัพธ์ (R)' : 'Completeness of Situation, Task, Action, and Result.',
      color: 'from-indigo-500 to-blue-500',
      textColor: 'text-indigo-400',
      data: scoreBreakdown.starStructure
    },
    {
      key: 'technicalAccuracy',
      label: lang === 'th' ? 'ความถูกต้องทางเทคนิค' : 'Technical Accuracy',
      description: lang === 'th' ? 'ความถูกต้องแม่นยำขององค์ความรู้เชิงลึก เทคโนโลยี และสถาปัตยกรรม' : 'Precision, terminology depth, and architecture accuracy.',
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-400',
      data: scoreBreakdown.technicalAccuracy
    },
    {
      key: 'communicationClarity',
      label: lang === 'th' ? 'ความชัดเจนในการสื่อสาร' : 'Communication Clarity',
      description: lang === 'th' ? 'การอธิบายความคิดอย่างกระชับ การจัดวางโครงสร้าง และความลื่นไหล' : 'Conciseness, flow, and structured articulation.',
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
      data: scoreBreakdown.communicationClarity
    },
    {
      key: 'confidenceDelivery',
      label: lang === 'th' ? 'ความมั่นใจและการส่งทอด' : 'Confidence & Delivery',
      description: lang === 'th' ? 'จังหวะการพูด น้ำเสียง และความมั่นใจในระหว่างการตอบ' : 'Delivery pacing, vocal stability, and camera confidence.',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
      data: scoreBreakdown.confidenceDelivery
    }
  ];

  // Recharts Radar Data
  const radarData = categories.map(cat => ({
    subject: cat.label,
    value: cat.data ? cat.data.score * 10 : 70, // Scale 10-point to 100 for visual uniformity
    fullMark: 100
  }));

  const toggleExpand = (key) => {
    if (expandedSubScore === key) {
      setExpandedSubScore(null);
    } else {
      setExpandedSubScore(key);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-6 animate-reveal mt-3">
      {/* Visual Radar Section */}
      <div className="w-full md:w-2/5 flex flex-col items-center justify-center bg-white/5 rounded-xl p-3 border border-white/5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          {lang === 'th' ? 'แผนภาพการให้คะแนน' : 'Evaluation Dimensions'}
        </span>
        <div className="text-center mb-2">
          <span className="text-3xl font-extrabold text-white">
            {overallScore ? overallScore.toFixed(1) : '7.0'}
          </span>
          <span className="text-gray-400 text-xs font-semibold">/10</span>
        </div>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 500 }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: '#4b5563', fontSize: 8 }}
                axisLine={false}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#818cf8"
                fill="#818cf8"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accordion Categories Section */}
      <div className="flex-1 flex flex-col gap-2.5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {lang === 'th' ? 'รายละเอียดคะแนนรายหมวดหมู่ (คลิกเพื่อดูเหตุผล)' : 'Detailed Rubric (Click to Expand Rationale)'}
        </span>

        {categories.map((cat) => {
          const score = cat.data ? cat.data.score : 7;
          const weight = cat.data ? cat.data.weight : 0.25;
          const rationale = cat.data ? cat.data.rationale : 'No rationale logged.';
          const isExpanded = expandedSubScore === cat.key;

          return (
            <div 
              key={cat.key} 
              className={`border rounded-xl transition duration-150 overflow-hidden ${
                isExpanded ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <button 
                onClick={() => toggleExpand(cat.key)}
                className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs md:text-sm">
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        (w: {weight})
                      </span>
                      <span className={`font-mono font-bold text-xs md:text-sm ${cat.textColor}`}>
                        {score}/10
                      </span>
                    </div>
                  </div>
                  
                  {/* Miniature progress bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                </div>
                <div className="text-gray-400 pl-3 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-white/5 bg-black/10">
                  <span className="text-[10px] text-indigo-300 font-bold block mb-0.5 uppercase tracking-wider">
                    {lang === 'th' ? 'การประเมินป้อนกลับ:' : 'Evaluator Rationale:'}
                  </span>
                  <p className="text-gray-300 text-xs leading-relaxed font-sans font-light">
                    {rationale}
                  </p>
                  <span className="text-[9px] text-gray-500 mt-1 block italic">
                    {cat.description}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
