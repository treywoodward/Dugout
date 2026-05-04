'use client'

interface DiamondDisplayProps {
  firstBase?: boolean
  secondBase?: boolean
  thirdBase?: boolean
  inning: number
  outs: number
  runs: number
  hits: number
}

export function DiamondDisplay({
  firstBase = false,
  secondBase = false,
  thirdBase = false,
  inning = 1,
  outs = 0,
  runs = 0,
  hits = 0,
}: DiamondDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Game State */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-slate-100 rounded p-3">
          <div className="text-2xl font-bold text-slate-900">{inning}</div>
          <div className="text-xs text-slate-600">Inning</div>
        </div>
        <div className="bg-slate-100 rounded p-3">
          <div className="text-2xl font-bold text-slate-900">{outs}</div>
          <div className="text-xs text-slate-600">Outs</div>
        </div>
        <div className="bg-green-100 rounded p-3">
          <div className="text-2xl font-bold text-green-700">{runs}</div>
          <div className="text-xs text-green-600">Runs</div>
        </div>
        <div className="bg-blue-100 rounded p-3">
          <div className="text-2xl font-bold text-blue-700">{hits}</div>
          <div className="text-xs text-blue-600">Hits</div>
        </div>
      </div>

      {/* Diamond Visualization */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-40 h-40 max-w-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Field background */}
          <circle cx="100" cy="100" r="90" fill="#90EE90" opacity="0.1" />

          {/* Diamond shape */}
          <polygon
            points="100,20 180,100 100,180 20,100"
            fill="none"
            stroke="#8B7355"
            strokeWidth="2"
          />

          {/* Base circles */}
          <circle
            cx="100"
            cy="40"
            r="8"
            fill={firstBase ? '#FF4444' : '#FFFFFF'}
            stroke="#000"
            strokeWidth="1"
          />
          <circle
            cx="160"
            cy="100"
            r="8"
            fill={secondBase ? '#FF4444' : '#FFFFFF'}
            stroke="#000"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="160"
            r="8"
            fill={thirdBase ? '#FF4444' : '#FFFFFF'}
            stroke="#000"
            strokeWidth="1"
          />

          {/* Home plate */}
          <polygon
            points="100,180 95,165 105,165"
            fill="#FFFFFF"
            stroke="#000"
            strokeWidth="1"
          />

          {/* Labels */}
          <text x="100" y="28" textAnchor="middle" fontSize="10" fontWeight="bold">
            1B
          </text>
          <text x="172" y="105" textAnchor="middle" fontSize="10" fontWeight="bold">
            2B
          </text>
          <text x="100" y="175" textAnchor="middle" fontSize="10" fontWeight="bold">
            3B
          </text>
        </svg>
      </div>

      {/* Base Status */}
      <div className="text-xs text-center text-slate-600">
        {!firstBase && !secondBase && !thirdBase ? (
          <span>Bases Empty</span>
        ) : (
          <span>
            {firstBase && '1B '}
            {secondBase && '2B '}
            {thirdBase && '3B'}
          </span>
        )}
      </div>
    </div>
  )
}
