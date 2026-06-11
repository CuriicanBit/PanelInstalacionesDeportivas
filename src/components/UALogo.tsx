import React from 'react';

export default function UALogo({ className = "h-28 w-auto" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 400 340" 
      className={className}
    >
      <defs>
        <style>
          {`
            .text-latin { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 13.5px; 
              fill: #A1A1AA; 
              letter-spacing: 2.5px; 
              font-weight: bold; 
            }
            .text-ua { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 66px; 
              fill: #FFFFFF; 
              font-weight: normal; 
              letter-spacing: -1px; 
            }
            .text-main { 
              font-family: 'Arial', 'Helvetica Neue', sans-serif; 
              font-size: 21px; 
              fill: #FAFAFA; 
              letter-spacing: 0.5px; 
              font-weight: bold; 
              text-anchor: middle; 
            }
          `}
        </style>
        
        {/* Trayecto curvo para el lema superior */}
        <path id="textPath-latin" d="M 110,43 Q 200,31 290,43" fill="none" />
      </defs>

      {/* 1. TEXTO SUPERIOR (DUC IN ALTUM) */}
      <text className="text-latin">
        <textPath href="#textPath-latin" startOffset="50%" textAnchor="middle">DUC IN ALTUM</textPath>
      </text>

      {/* 2. ESCUDO ROJO */}
      <path d="M 125,52 
               L 275,52 
               C 275,120 263,185 200,225 
               C 137,185 125,120 125,52 Z" 
            fill="#E42313" />

      {/* 3. LETRAS "UA" */}
      <text x="199" y="144" className="text-ua" textAnchor="middle">UA</text>

      {/* 4. TEXTO INFERIOR (UNIVERSIDAD AUTÓNOMA DE CHILE) */}
      <text x="200" y="278" className="text-main">UNIVERSIDAD AUTÓNOMA</text>
      <text x="200" y="310" className="text-main" fontSize="23px" letterSpacing="1px">DE CHILE</text>
    </svg>
  );
}
