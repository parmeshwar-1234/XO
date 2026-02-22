import React, { useState } from 'react';
import { Copy, Check, Zap } from 'lucide-react';
import LoadingDots from './LoadingDots';

interface SlugifyOptions {
  separator: string;
  lowercase: boolean;
  removeAccents: boolean;
  removeSpecialChars: boolean;
}

const SlugifyText: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<SlugifyOptions>({
    separator: '-',
    lowercase: true,
    removeAccents: true,
    removeSpecialChars: true,
  });

  // Function to remove accents from characters
  const removeAccents = (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Main slugify function
  const slugify = (text: string, opts: SlugifyOptions): string => {
    let result = text;

    // Remove accents if enabled
    if (opts.removeAccents) {
      result = removeAccents(result);
    }

    // Convert to lowercase if enabled
    if (opts.lowercase) {
      result = result.toLowerCase();
    }

    // Remove special characters if enabled
    if (opts.removeSpecialChars) {
      result = result.replace(/[^\w\s-]/g, '');
    }

    // Replace spaces and multiple separators with the chosen separator
    result = result
      .trim()
      .replace(/[\s_]+/g, opts.separator)
      .replace(new RegExp(`${opts.separator}+`, 'g'), opts.separator)
      .replace(new RegExp(`^${opts.separator}+|${opts.separator}+$`, 'g'), '');

    return result;
  };

  // Handle slugification
  const handleSlugify = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    // Simulate processing delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    const slugified = slugify(inputText, options);
    setOutputText(slugified);
    setIsProcessing(false);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle input change - auto slugify
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.trim()) {
      const slugified = slugify(text, options);
      setOutputText(slugified);
    } else {
      setOutputText('');
    }
  };

  // Handle option changes
  const handleOptionChange = (
    key: keyof SlugifyOptions,
    value: string | boolean
  ) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);

    if (inputText.trim()) {
      setOutputText(slugify(inputText, newOptions));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Input Section */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-semibold text-foreground">
          Enter Text
        </label>
        <textarea
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste your text here... (will auto-slugify)"
          className="w-full h-24 sm:h-32 p-3 sm:p-4 rounded-xl border border-border/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition neu-inset text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Characters: {inputText.length}
        </p>
      </div>

      {/* Options Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Separator Option */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-foreground">
            Separator
          </label>
          <select
            value={options.separator}
            onChange={(e) => handleOptionChange('separator', e.target.value)}
            className="w-full p-2 sm:p-3 rounded-xl border border-border/30 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition neu-inset text-xs sm:text-sm"
          >
            <option value="-">Hyphen (-)</option>
            <option value="_">Underscore (_)</option>
            <option value="">No separator</option>
          </select>
        </div>

        {/* Lowercase Option */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={(e) => handleOptionChange('lowercase', e.target.checked)}
              className="w-4 sm:w-5 h-4 sm:h-5 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              Lowercase
            </span>
          </label>
        </div>

        {/* Remove Accents Option */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.removeAccents}
              onChange={(e) =>
                handleOptionChange('removeAccents', e.target.checked)
              }
              className="w-4 sm:w-5 h-4 sm:h-5 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              Remove Accents
            </span>
          </label>
        </div>

        {/* Remove Special Characters Option */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.removeSpecialChars}
              onChange={(e) =>
                handleOptionChange('removeSpecialChars', e.target.checked)
              }
              className="w-4 sm:w-5 h-4 sm:h-5 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              Remove Special Chars
            </span>
          </label>
        </div>
      </div>

      {/* Output Section */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-semibold text-foreground">
          Slugified Text
        </label>
        <div className="relative">
          <div className="w-full p-3 sm:p-4 rounded-xl border border-border/30 bg-background/50 text-foreground neu-inset min-h-[48px] sm:min-h-[56px] flex items-center justify-between gap-2 overflow-hidden">
            <span className="font-mono text-xs sm:text-sm break-all">
              {outputText || (
                <span className="text-muted-foreground">
                  Your slug will appear here...
                </span>
              )}
            </span>
            {isProcessing && <LoadingDots size="sm" />}
          </div>

          {outputText && (
            <button
              onClick={handleCopy}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg neu-raised-sm hover:shadow-md transition-all duration-200"
              data-tooltip={isCopied ? 'Copied!' : 'Copy to clipboard'}
            >
              {isCopied ? (
                <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
              ) : (
                <Copy className="w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Manual Slugify Button */}
      {!outputText && inputText && (
        <button
          onClick={handleSlugify}
          disabled={isProcessing}
          className="w-full bg-gradient-to-br from-purple-600 to-purple-700 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {isProcessing ? (
            <>
              <LoadingDots size="sm" /> Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
              Slugify Now
            </>
          )}
        </button>
      )}

      {/* Info Section */}
      <div className="neu-inset rounded-xl p-3 sm:p-4 space-y-2">
        <h4 className="font-semibold text-xs sm:text-sm text-foreground">What is a slug?</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A slug is a URL-friendly version of text, typically lowercase with special
          characters removed and spaces replaced with hyphens. Perfect for URLs, file
          names, and database identifiers.
        </p>
        <div className="pt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            <strong>Example:</strong>
          </p>
          <p className="text-xs font-mono text-foreground break-all">
            "Hello World! 🚀" → "hello-world"
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlugifyText;
