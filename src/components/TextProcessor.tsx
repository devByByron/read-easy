import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const LANGUAGE_MODELS = [
  { code: "fr", name: "French", model: "Helsinki-NLP/opus-mt-en-fr" },
  { code: "de", name: "German", model: "Helsinki-NLP/opus-mt-en-de" },
  { code: "es", name: "Spanish", model: "Helsinki-NLP/opus-mt-en-es" },
];

const TextProcessor: React.FC = () => {
  const [extractedText, setExtractedText] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeProcessor, setActiveProcessor] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("fr");

  const processWithAI = async (
    text: string,
    type: string,
    langModel?: string
  ): Promise<string> => {
    try {
      const response = await fetch("/.netlify/functions/huggingface", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text, langModel }),
      });

      const data = await response.json();

      // Retry once if model is still loading
      if (data.loading) {
        console.log("Model loading... retrying in 3s");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return await processWithAI(text, type, langModel);
      }

      if (data.error) {
        return `Error: ${data.error}`;
      }

      return data.result || "No output generated.";
    } catch (error) {
      console.error("Error in processWithAI:", error);
      return "Error: Could not process request.";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Input Text */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Paste or type text here..."
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      {/* Output Text */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={processedText}
            readOnly
            placeholder="Processed output will appear here..."
            className="min-h-[200px] bg-muted"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="md:col-span-2 flex flex-wrap gap-4 justify-center">
        {/* Summarize */}
        <Button
          onClick={async () => {
            setProcessing(true);
            setActiveProcessor("summarize");
            const result = await processWithAI(extractedText, "summarize");
            setProcessedText(result);
            setProcessing(false);
          }}
          disabled={processing}
        >
          {processing && activeProcessor === "summarize" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Summarize
        </Button>

        {/* Simplify */}
        <Button
          onClick={async () => {
            setProcessing(true);
            setActiveProcessor("simplify");
            const result = await processWithAI(extractedText, "simplify");
            setProcessedText(result);
            setProcessing(false);
          }}
          disabled={processing}
        >
          {processing && activeProcessor === "simplify" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Simplify
        </Button>

        {/* Translate */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border rounded p-2"
          >
            {LANGUAGE_MODELS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <Button
            onClick={async () => {
              setProcessing(true);
              setActiveProcessor("translate");
              const langModel = LANGUAGE_MODELS.find(
                (l) => l.code === selectedLanguage
              )?.model;
              const result = await processWithAI(
                extractedText,
                "translate",
                langModel
              );
              setProcessedText(result);
              setProcessing(false);
            }}
            disabled={processing}
          >
            {processing && activeProcessor === "translate" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Translate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TextProcessor;
