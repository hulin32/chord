interface FeedbackPanelProps {
    feedback: {
        type: "success" | "error" | null
        message: string
    }
    isAnalyzing: boolean
}

export function FeedbackPanel({ feedback, isAnalyzing }: FeedbackPanelProps) {
    if (!feedback.message) {
        return null
    }

    return (
        <div className={`rounded-xl shadow-lg p-5 ${feedback.type === "success" ? "bg-green-50 border-l-4 border-green-500" :
            feedback.type === "error" ? "bg-red-50 border-l-4 border-red-500" :
                "bg-blue-50 border-l-4 border-blue-500"
            }`}>
            <div className={`flex items-start text-base font-medium ${feedback.type === "success" ? "text-green-800" :
                feedback.type === "error" ? "text-red-800" :
                    "text-blue-800"
                }`}>
                <div className="flex-shrink-0 mr-3 mt-1">
                    {isAnalyzing && (
                        <span className="inline-block animate-spin text-xl">⏳</span>
                    )}
                    {feedback.type === "success" && !isAnalyzing && (
                        <span className="text-xl">✅</span>
                    )}
                    {feedback.type === "error" && !isAnalyzing && (
                        <span className="text-xl">❌</span>
                    )}
                    {!feedback.type && !isAnalyzing && (
                        <span className="text-xl">ℹ️</span>
                    )}
                </div>
                <div className="flex-1">
                    {feedback.message}
                </div>
            </div>
        </div>
    )
}
