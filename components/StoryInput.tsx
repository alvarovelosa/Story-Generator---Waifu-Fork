import React, { useRef, useMemo, useEffect } from 'react';

type StoryPart = {
  text: string;
  type: 'user' | 'ai';
  id: number;
  color?: string;
};

interface StoryInputProps {
  storyParts: StoryPart[];
  onStoryChange: (text: string) => void;
}

// Custom hook to get the previous value of a prop or state
const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};


const StoryInput: React.FC<StoryInputProps> = ({ storyParts, onStoryChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const prevStoryParts = usePrevious(storyParts);

  const storyHtml = useMemo(() => {
    return storyParts.map(part => {
        // Escape HTML to prevent injection
        const escapedText = part.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // Replace newlines with <br> for HTML rendering
        const textWithBreaks = escapedText.replace(/\n/g, '<br>');
        // Use the part's specific color, or fall back to default user/ai colors
        const colorClass = part.color || (part.type === 'ai' ? 'text-purple-400' : 'text-gray-200');
        return `<span class="${colorClass}">${textWithBreaks}</span>`;
    }).join('');
  }, [storyParts]);
  
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Determine if this is an update from the AI (a new 'ai' part was added)
    const isAIUpdate = prevStoryParts && 
                     storyParts.length > prevStoryParts.length && 
                     storyParts[storyParts.length - 1].type === 'ai';

    // We only want to programmatically update the DOM if the AI has added new content.
    // We should not interfere when the user is typing, as that causes cursor and focus issues.
    if (isAIUpdate) {
      editor.innerHTML = storyHtml;

      // After the AI update, move the cursor to the very end of the content.
      const selection = window.getSelection();
      const range = document.createRange();
      if (selection) {
        selection.removeAllRanges();
        range.selectNodeContents(editor);
        range.collapse(false); // 'false' collapses the range to its end point
        selection.addRange(range);
        editor.focus();
      }
    } else if (!prevStoryParts) {
      // Handle the initial render of the component
      editor.innerHTML = storyHtml;
    }

  }, [storyParts, storyHtml, prevStoryParts]);

  const handleInput = () => {
    if (editorRef.current) {
      // When the user types, notify the parent component of the new text content.
      // This will cause a state update, but our useEffect is smart enough not to
      // re-render the innerHTML, thus preserving the cursor position.
      onStoryChange(editorRef.current.innerText);
    }
  };

  const isEmpty = storyParts.length === 1 && storyParts[0].text.trim() === '';

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={true}
        onInput={handleInput}
        className="w-full min-h-[200px] p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-y relative z-10 whitespace-pre-wrap leading-relaxed"
        suppressContentEditableWarning={true}
        role="textbox"
        aria-multiline="true"
      />
      {isEmpty && (
        <div className="absolute top-4 left-4 text-gray-500 pointer-events-none z-0">
          In a realm of floating islands and whispered prophecies, a young cartographer discovered a map that wasn't on any chart...
        </div>
      )}
    </div>
  );
};

export default StoryInput;
