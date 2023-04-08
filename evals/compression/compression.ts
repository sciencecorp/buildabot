/**
 * The purpose of this eval is to test different compression strategies for the chat log.
 * We want to achieve a balance between different "costs":
 * 1. The amount of information lost in the compression
 * 2. The number of tokens used in the compressed output
 * 3. The drift in instruction-following from the original chat session
 * 4. The amount of time it takes to compress the chat log
 *
 * Some additional considerations:
 *
 * We don't really care about "reversibility" in principle (i.e. the ability
 * to "decompress" to the original chat log), but it might be an interesting
 * metric to track because it likely correlates with other desirable metrics.
 *
 * Compression is slow, and it is slower the more tokens we allow it to
 * produce, so lower compression factors are slower. This is unintuitive from a
 * traditional compression perspective where higher compression factors usually
 * come at the cost of more compute.
 *
 * The compression can be done asynchronously, so we can start compressing
 * in the background while the user is still chatting. We only end up blocking
 * the session if the user sends a message that is too long to fit together with
 * the reply in the remaining tokens.
 *
 * In principle if we care about quality and not cost, we only need to compress
 * "down to" L-B tokens, where L is the total LIMIT of tokens that the model
 * supports and B is a BUFFER for the next messages. B is a tunable parameter,
 * if it is too small too often we will need to retry the compression with a
 * bigger B, which significantly increases round-trip because we'll need to
 * block.
 *
 * In practice, GPT4 at least seems to have a hard time using its token budget
 * fully, and will compress out information it doesn't need to, meaning we can
 * choose at what # of tokens to _start_ compressing, but can't (precisely)
 * choose how many tokens to compress "down to".
 */
