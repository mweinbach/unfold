"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Copy } from "lucide-react"
import { FinalOutput } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface DocumentProcessorProps {
  isProcessing: boolean;
  documentContext: string;
  output: FinalOutput;
  instructions: string;
  onInstructionsChange: (value: string) => void;
}

export function DocumentProcessor({
  isProcessing,
  documentContext,
  output,
  instructions,
  onInstructionsChange,
}: DocumentProcessorProps) {
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [isOutputOpen, setIsOutputOpen] = useState(true)
  const { toast } = useToast()

  const handleCopy = async () => {
    const text = `${output.documentContext}\n\n${output.userInstructions}`
    await navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Output copied to clipboard",
      duration: 2000,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card rounded-xl shadow-md border transition-shadow duration-200 hover:shadow-lg sticky top-4">
      <div className="space-y-6 flex-none">
        <Collapsible
          open={isContextOpen}
          onOpenChange={setIsContextOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Document Context</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  isContextOpen ? "" : "transform rotate-180"
                }`} />
                <span className="sr-only">Toggle document context</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="space-y-2">
            <Card className="p-4 bg-muted/30 max-h-[30vh] overflow-y-auto border rounded-xl">
              <pre className="whitespace-pre-wrap text-sm scrollbar-thin">
                {isProcessing ? "Processing documents..." : documentContext}
              </pre>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="space-y-6 flex-none">
        <h2 className="text-xl font-semibold">Your Instructions</h2>
        <Textarea 
          placeholder="Enter your instructions here..." 
          className="min-h-[100px] resize-none"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        <Collapsible
          open={isOutputOpen}
          onOpenChange={setIsOutputOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Final Output</h2>
              {instructions && output.documentContext && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5" 
                  onClick={handleCopy}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  isOutputOpen ? "" : "transform rotate-180"
                }`} />
                <span className="sr-only">Toggle final output</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="space-y-2">
            <Card className={`p-4 space-y-4 bg-muted/30 overflow-y-auto border rounded-xl ${
              isContextOpen ? 'max-h-[30vh]' : 'max-h-[50vh]'
            }`}>
              <pre className="whitespace-pre-wrap text-sm scrollbar-thin">
                {output.documentContext}
                {'\n\n'}
                {output.userInstructions}
              </pre>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}