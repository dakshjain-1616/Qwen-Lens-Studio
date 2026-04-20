"""Visual Reasoning Processor with thinking trace extraction."""

import re
from typing import AsyncGenerator, Dict, Any


class VisualReasoningProcessor:
    """Processor for visual reasoning with chain-of-thought extraction."""
    
    THINK_START = "<|im_start|>think"
    THINK_END = "<|im_end|>"
    
    def __init__(self):
        self.system_prompt = (
            "You are a visual reasoning expert. Think carefully about the image before answering. "
            "Wrap your internal reasoning in <|im_start|>think...<|im_end|> tags before your final answer."
        )
    
    def get_system_prompt(self, show_thinking: bool = False) -> str:
        """Get system prompt, optionally with thinking instructions."""
        if show_thinking:
            return self.system_prompt
        return "You are a visual reasoning expert. Analyze the image carefully and provide your answer."
    
    def parse_thinking_response(self, text: str) -> Dict[str, str]:
        """Parse thinking tags from response."""
        thinking = ""
        answer = text
        
        # Look for thinking tags
        think_match = re.search(
            rf'{re.escape(self.THINK_START)}(.*?){re.escape(self.THINK_END)}',
            text,
            re.DOTALL
        )
        
        if think_match:
            thinking = think_match.group(1).strip()
            # Remove thinking block from answer
            answer = re.sub(
                rf'{re.escape(self.THINK_START)}.*?{re.escape(self.THINK_END)}',
                '',
                text,
                flags=re.DOTALL
            ).strip()
        
        return {
            "thinking": thinking,
            "answer": answer
        }
    
    async def stream_with_events(
        self,
        stream_generator: AsyncGenerator[str, None],
        show_thinking: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chunks with event type annotations."""
        if not show_thinking:
            # Simple streaming without thinking separation
            async for chunk in stream_generator:
                yield {"event": "answer", "data": chunk}
            return
        
        # Track state for thinking/answer separation
        in_thinking = False
        thinking_buffer = ""
        answer_buffer = ""
        think_start_seen = False
        
        async for chunk in stream_generator:
            if not think_start_seen:
                # Check for think start
                if self.THINK_START in chunk:
                    think_start_seen = True
                    in_thinking = True
                    # Split at think start
                    parts = chunk.split(self.THINK_START, 1)
                    if parts[0]:
                        yield {"event": "answer", "data": parts[0]}
                    if len(parts) > 1:
                        thinking_buffer = parts[1]
                    continue
                else:
                    yield {"event": "answer", "data": chunk}
                    continue
            
            if in_thinking:
                # Check for think end
                if self.THINK_END in chunk:
                    in_thinking = False
                    parts = chunk.split(self.THINK_END, 1)
                    thinking_buffer += parts[0]
                    # Yield accumulated thinking
                    if thinking_buffer:
                        yield {"event": "thinking", "data": thinking_buffer}
                    # Remaining goes to answer
                    if len(parts) > 1 and parts[1]:
                        yield {"event": "answer", "data": parts[1]}
                else:
                    thinking_buffer += chunk
                    # Stream thinking progressively
                    yield {"event": "thinking", "data": chunk}
            else:
                yield {"event": "answer", "data": chunk}
