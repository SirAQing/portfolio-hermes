# AI Capability Dictionary

As generative AI technology becomes widely adopted across various products and business scenarios, an increasingly practical question confronts each of us: **What AI capabilities are actually available?** And for specific requirements, **which capability, which type of model, or which product should we choose?**

Faced with this confusion, the most intuitive approach might be to "cram at the last minute": **search for cloud service providers' product APIs or corresponding models when a need arises, and look for commercial-grade solutions with documentation and demos on the market**. See an image need and think of image generation, encounter a text task and grab a large model, deal with voice interaction and recall ASR and TTS, then comparison-shop among a sea of APIs and services. However, assembling scattered products is fundamentally different from systematically planning, selecting, and combining AI capabilities in enterprise-level scenarios. Relying solely on ad hoc research and experiential judgment leads to a host of serious challenges: fragmented capability awareness, arbitrary solution design, and difficult capability reuse.

To address these pain points, this article was born from an approach centered on an "AI Capability Landscape." In this handbook, our goal is not to pile up terminology, but to help you quickly figure out three things: **"What AI capability can be used for this task? What type of model or product should I roughly choose? What keywords should I use next to find APIs, projects, or services to try?"** Through a systematic review spanning modalities (text, image, audio, video, 3D, multimodal) to architecture layers (models, retrieval, agents, platform engineering), **we can identify corresponding AI capabilities, representative models/products, and common use cases in real business for each type of typical need and scenario**, helping teams build AI systems with lower trial-and-error costs, higher decision-making efficiency, and stronger reusability.

In this handbook, we will systematically introduce today's mainstream AI capability landscape, from single-modality to multimodal fusion, from individual models to the overall framework of platforms and engineering, combined with common product forms and application scenarios, to provide practice-oriented capability selection references.

> Due to the **large amount of content**, you can refer back to this handbook when you encounter scenarios where you're unsure how to make selection decisions; we recommend that you **based on your specific application direction, have AI reference this handbook to provide model selection suggestions and API call recommendations.**

If you only want to understand the corresponding categories without reading the detailed content, you only need to read the introductory paragraphs of each major chapter, such as sections 1.1 and 1.2, without needing to read sections 1.1.1 or 1.1.2.

**We recommend consulting only the relevant sections of this handbook when needed, or browsing the top-level table of contents, and reading the full text only if interested.**

**Future updates will include recommended model API service addresses within each chapter section.**

# What You'll Learn in This Lesson

- AI Capability Panorama: The overall capability taxonomy from text, images, audio, video, 3D to multimodal, agents, RAG, safety, and platform engineering
- Models and products corresponding to each capability: Understand the representative models and services behind key capabilities such as Embedding, OCR, ASR, TTS, VLM, RAG, etc.
- Methods for mapping capabilities to scenarios: Master how to transform a "capability checklist" into specific applications such as content products, search and Q&A, intelligent customer service, and automated operations

After completing this handbook, you will have established a beginner-level systematic understanding of mainstream AI capabilities. You will not only know "what capabilities exist on the market and what products are commonly paired with them," but also understand their positions and relationships within the overall architecture. You will know how to quickly locate the required capabilities and make well-founded selection decisions when facing specific business needs, laying a solid foundation for building an AI capability system.

## Model Parameters Referenced in This Handbook

Before diving into the specific capability map, let's clarify a frequently mentioned but somewhat abstract concept: what exactly counts as a large model? And what counts as a small model?

**From an academic perspective**, large models typically refer to general-purpose models with parameter counts in the billions, tens of billions, or even trillions, while small models are specialized models targeting specific tasks or scenarios with smaller parameter counts (tens of millions to hundreds of millions).

**From a pricing perspective**, if a model's API calls are very cheap — for example, billed at fractions of a cent per call, or only fractions of a cent to a few cents per thousand tokens — and there's no particular emphasis on being a general-purpose large model, it's usually either a typical small model (such as models specialized for OCR, ASR, image classification, or content moderation) or a lightweight version of a large model with reduced parameters (specifically compressed or distilled for high concurrency and low cost). If the per-call price is notably high, such as several dozen cents or even a dollar per call, then it's most likely a large model.

Additionally, if the product copy explicitly emphasizes the use of a large language model (LLM), general-purpose large model, or multimodal large model, or mentions end-to-end completion of complex tasks from input to output (such as end-to-end chatbots, end-to-end retrieval Q&A, end-to-end video generation), it can generally be regarded as a large model.

Conversely, if the promotional focus is on a specific vertical capability, such as bank card recognition, invoice recognition, license plate recognition, ad click-through rate prediction, speech transcription, or content safety review, it indicates that the product is more likely powered by one or a group of small models.

Therefore, in the following discussion, we can make a pragmatic convention:

- Large models refer more to those general-purpose, conversational, programmable, and often slightly more expensive models (including their multimodal versions, such as GPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet, etc.), which can cover most general text, code, and multimodal tasks involving images, audio, and video;
- Small models refer to those fine-tuned or customized for a specific task, usually cheaper, with more stable and controllable performance, but with a narrower scope of application, requiring you to actively combine and orchestrate them in your system.

It's worth noting a key industry shift: many of the model capabilities mentioned in this handbook were actually handled by "small models" before 2021, with dedicated models trained for specific scenarios and data to meet precise needs. **Today, the vast majority of general-purpose scenarios and tasks can be directly addressed by calling large models.**

From the perspective of pursuing ultimate **precision and cost**, the training and application of small models still hold irreplaceable value; but **for beginners, we can absolutely start by learning to find and call large model APIs**, then gradually delve into more advanced approaches. You simply need to make trade-offs between cost, precision, and latency, then decide where to use general-purpose large models and where to retain or introduce specialized small models.

> **Get to know some common products** — commonly used text and multimodal general-purpose large models:
>
> - OpenAI series: GPT-4, GPT-4.1, GPT-4o, GPT-5.1, etc.
> - Google series: Gemini 1.5 Pro, Gemini 1.5 Flash, etc.
> - Anthropic series: Claude 3.5 Sonnet, Claude 3.5 Haiku, etc.
> - Chinese models: Qwen series, ERNIE Bot series, GLM/Zhipu Qingyan, Tencent Hunyuan, iFlytek Spark, the large model behind Moonshot's Kimi, MiniMax MiniMax-M2.7 series, etc.
>
> Large models and services more focused on vision and video, including:
>
> - Image generation: DALL·E, Midjourney, Stable Diffusion, SDXL, Flux, etc.
> - Multimodal visual understanding: GPT-4o, GPT-4.1 with Vision, Gemini 1.5 (image-text multimodal), Claude 3.5 Sonnet Vision, LLaVA, etc.
> - Video generation: Sora, Kling, Runway Gen-2, Pika, Luma, Veo, etc.
>
> Large models for speech and audio, including:
>
> - Speech recognition ASR: Whisper series (Whisper, Whisper-large-v3, etc.), Deepgram, end-to-end ASR large models from various cloud vendors (such as iFlytek, Baidu, Volcano Engine, Alibaba, etc.)
> - Speech multimodal and voice dialogue: GPT-4o (end-to-end voice dialogue), OpenAI Realtime, Gemini 1.5's audio understanding capabilities, etc.
> - TTS / audio and music generation: OpenAI TTS, ElevenLabs, Suno, Udio, MusicGen, etc.
>
> 3D / spatial generation and understanding models, including:
>
> - Text-to-3D and image-to-3D: DreamFusion, Shap-E, GET3D, Zero-1-to-3, TripoSR, etc.
> - NeRF / neural rendering family: Instant-NGP, NeRF series, Gaussian Splatting related models, etc.

# 1. Text Tasks (Text / NLP / LLM)

Among AI capabilities, text tasks are the most fundamental. Whether we ultimately want to do content moderation, search and recommendation, knowledge Q&A, writing assistants, or code copilots, they all fundamentally revolve around one question: how can machines truly understand text.

## 1.1 Foundational Language Modeling and Representation

Let's start from the most fundamental layer: language modeling and representation. Its purpose is to let machines first become familiar with language in a statistical sense, and on this basis find stable vector matrix representations for words, sentences, and documents, to facilitate subsequent tasks such as classification, matching, extraction, and generation. No matter what text-related task lies ahead, we more or less need to answer the same question first: how do I represent a passage of text with a sequence of numbers?

We can briefly examine this from three perspectives — scenarios, principles, and models:

- **Scenarios**
  - **Search and retrieval related**
    - General search engines: Users type in any sentence and get semantically relevant documents, rather than only exact keyword matches.
    - In-site search / e-commerce search: Users describe things in colloquial language (e.g., "a white shirt suitable for summer commuting") and find semantically matching products.
    - Document / knowledge base retrieval: In technical documents, policy regulations, or enterprise knowledge bases, directly input a sentence and get relevant entries.
  - **Recommendation and ranking related**
    - Feed / content recommendation: Based on what users have recently viewed and clicked, automatically find other content with similar meaning to continue recommending, rather than relying solely on manual rules or tags.
    - E-commerce / product recommendation: Based on descriptions of products users have viewed, purchased, or bookmarked, find products with similar style or purpose for personalized recommendation.
    - User interest modeling: Based on titles users have read, search terms used, etc., summarize several main interest directions to improve recommendation and ranking effectiveness.
  - **Q&A assistant related**
    - FAQ Q&A: Users ask the same question in different ways ("How do I get an invoice?" vs "Where can I get an invoice?"), and the system maps them to the same answer.
    - Knowledge base Q&A / enterprise assistant: Users ask questions in natural language, and the system matches by meaning within internal documents to find the most relevant passages to answer.
  - **Text understanding and analysis related**
    - Review sentiment analysis: Categorize large volumes of reviews and posts roughly by "what they're about / what the sentiment is."
    - Text deduplication / similarity detection: Used to discover rewritten or pseudo-original articles.
    - Document clustering / grouping: Group many articles and reports by content similarity for navigation, recommendation, or sampling inspection.
  - **As universal features for downstream tasks (downstream tasks refer to using the model's basic capabilities to achieve more specific text processing tasks)**
    - Text classification: Downstream models for sentiment classification, intent recognition, spam detection, etc., directly reuse this layer's representations.
    - Information extraction: Entity recognition and relation extraction are fine-tuned on word/sentence representations rather than trained from scratch.
    - Text generation: Provides semantic representation input for generation tasks such as summarization, rewriting, and continuation, improving generation quality and controllability.
- **Principles**
  Learning representations of words, sentences, and documents to serve as a foundation for subsequent more complex tasks.
  - Language modeling
    - Autoregressive language models: Predict the next token (GPT series, LLaMA, Qwen, etc.)
    - Masked language models (Masked LM): Predict masked tokens (BERT, RoBERTa, ERNIE)
  - Word / sentence / paragraph representation
    - Static word embeddings: Word2Vec, GloVe, FastText
    - Contextual representations: BERT embedding, Sentence-BERT, etc.
    - Document-level vectors: Used for semantic retrieval and similarity matching
- **Models**
  BERT / RoBERTa / ERNIE, GPT family, LLaMA / Qwen / Yi and other LLMs; various embedding models (OpenAI text-embedding-3 series, bge, E5, SimCSE, etc.).

### **1.1.1 Language Modeling: Learning Language Through "Guessing the Next Word"**

The first step at this layer is to let the model **become familiar with language patterns** in large volumes of text. The approach can be simply understood as: giving the model countless "word guessing exercises," where after seeing the context of a passage, it fills in the most reasonable word (token). With enough exercises and sufficiently broad corpora, the model gradually learns: what a natural sentence looks like, which words frequently appear together, and what expressions sound awkward. This process is called "language modeling," and is essentially a unified **word guessing training mechanism**.

There are two common types of exercises, each illustrated with a simple example:

1. **Continuation (autoregressive)**: Only provide the preceding content and let the model guess "what comes next."
2. Input prefix: `It rained today, so I`
3. Model task: Guess the next word, such as "**brought** (an umbrella)," "**didn't** (go out)," "**planned** (to stay home)," etc., then continue generating further.
   This approach primarily trains the model's grasp of **continuation, coherence, and common expressions**.
4. **Fill-in-the-blank (masked)**: Create a gap in the middle and let the model use both preceding and following context to fill it in.
5. Original sentence: `It rained today, so I brought an umbrella`
6. Training sentence: `It [MASK] today, so I brought an umbrella`
7. Model task: Fill `[MASK]` with a reasonable word like "**rained**."
   Here the model must look at both the left side ("It," "today") and the right side ("so I brought an umbrella") to decide what to fill in, which is more conducive to learning **whole-sentence semantics**.

By repeatedly doing these two types of "word guessing exercises" on massive corpora, the model gradually accumulates a **sense of language and statistical common sense**. On this basis, the next step is to explicitly turn this ability into **vector representations of words, sentences, and documents**, laying the groundwork for subsequent tasks such as retrieval, recommendation, and Q&A.

### 1.1.2 Word, Sentence, and Document Representation: Mapping Discrete Symbols to Semantic Space

The earliest approach to building text vectors was **static word embeddings**: assigning each word a fixed vector that doesn't change with context after training — intuitive and simple, but **unable to distinguish meanings of polysemous words in different contexts.** To solve this problem, context-based dynamic representation methods emerged later: the same word generates different vectors in different sentences, entirely determined by its context. For example, "Apple" in "Apple released a new phone" would be closer to the "tech company" semantic direction, while in "Apples are rich in vitamins" it would be closer to the "fruit" concept.

This mechanism not only improved word-level expressiveness but also paved the way for sentence and document vectorization. For sentences, sentence vectors can be generated; for documents, the entire text can be encoded as input (if length permits), or encoded in segments and then aggregated into a global vector through attention mechanisms, hierarchical pooling, contrastive learning, and other methods. Recent specialized embedding models (such as bge, E5, and the text-embedding series) have been continuously optimized around the goal of "bringing semantically similar text closer in vector space," performing particularly well in tasks such as semantic retrieval and similarity matching.

This pipeline — from contextual modeling to sentence/document vector generation — has become the core infrastructure behind search, recommendation, and Q&A systems. Let's return to the various scenarios mentioned earlier:

- Retrieval and search scenarios (general search, e-commerce search, knowledge base retrieval) all need to encode both user input and candidate documents into vectors, then perform similarity matching in vector space to find the semantically closest results, rather than relying solely on exact keyword matching.
- Recommendation and ranking scenarios (feed recommendation, product recommendation, user interest modeling) need to convert content corresponding to users' historical behavior into vectors, then find new content with similar vectors to recommend, achieving the personalized effect of "viewed A, recommend B."
- Q&A assistant scenarios (FAQ Q&A, knowledge base Q&A) need to encode both user questions and knowledge base questions or paragraphs into vectors, finding the best matching answer through vector similarity.
- Text understanding and analysis scenarios (review sentiment, deduplication, clustering) need to first convert each text into a vector, then perform clustering, similarity computation, or classification based on vectors.
- Downstream task scenarios (text classification, information extraction, text generation) directly use this layer's vector representations as input features, feeding them to subsequent classifiers, extractors, or generators to avoid learning semantics from scratch.

From an engineering perspective, the common practice is to encapsulate this as a unified "text vector service": input any text, output a fixed-dimension vector, shared across search, recommendation, Q&A, and other systems. At the product level, this layer's capabilities are mainly reflected in: semantic recall in search and recommendation (no longer relying solely on keywords, but recalling "differently worded but similar in meaning" content through vector similarity), and unified embedding / vector retrieval services for enterprise knowledge bases, FAQs, and case libraries.

## 1.2 Text Classification and Text Matching (Classification & Matching)

In the previous section, we found a "coordinate" in semantic space for each piece of text through foundational language modeling and representation. But coordinates alone are not enough — what businesses truly care about is often: what category does this text belong to? Is it about the same thing as another text? Do two sentences logically support or contradict each other? You can think of it this way: using classification and matching capabilities to transform the underlying vector representations into labels and relevance signals that can directly drive business decisions. We still examine this layer from three perspectives — scenarios, principles, and models:

- **Scenarios**
  - Content understanding and moderation: Tagging reviews, posts, and articles with topic, sentiment, risk, and other labels for moderation, recommendation, and statistical analysis.
  - Recommendation and ranking: Based on the match between "user interest tags" and "content tags," deciding which content to display and how prominently.
  - Search and FAQ: Users casually type a natural language question, and the system automatically finds the most relevant question-answer pair or document fragment.
  - Similar content identification: Finding "similar content" items in large text collections for deduplication, merged statistics, and recommending "related content."
  - Logical relationship judgment: Determining whether two sentences support, contradict, or are unrelated to each other, used for fact-checking, multi-turn dialogue consistency checks, etc.
- **Principles**
  Building on semantic representations, making holistic judgments about entire texts or text pairs:
  - Text classification: Labeling a single text (e.g., sentiment, topic, risk type, etc.);
  - Text matching: Judging the similarity, relevance, or "question-answer" match between two texts;
- **Models**
  Based on pretrained encoders, with simple classification / matching structures added:
  - Single text classification: BERT / RoBERTa / DeBERTa + fully connected classification layer;
  - Text matching: Sentence-BERT, SimCSE, Bi-Encoder, Cross-Encoder;
  - Complex judgment: Through instruction tuning on LLMs, having the model directly output labels or logical relationships.

### 1.2.1 Text Classification: From "Understanding Content" to "Categorizing Content"

Leveraging the semantic representations from the previous layer, we can very naturally attach a simple classification head on top, and with a small amount of labeled data, enable the model to answer one question: **"What category does this text belong to?"**

The most classic is **sentiment classification**. A user's review might express approval, complaint, or simply state facts. After obtaining the vector representation of this sentence, the model only needs a softmax classification layer to output probabilities for "positive / negative / neutral." This capability is already very mature in e-commerce, social media, app store, and other scenarios.

Another major category is **topic / industry classification**. In news recommendation, we want to know whether an article is about sports, finance, or entertainment; enterprise internal customer service / ticket systems care more about whether it's a product inquiry, feature issue, or complaint/suggestion. These labels can help content be routed more precisely to appropriate processes and serve as important features in the recommendation ranking stage.

Going further, **risk / compliance classification** is directly related to platform safety. We set up specialized classification models for categories such as advertising diversion, verbal abuse, politically sensitive content, and vulgar/pornographic material, combined with manual review, to intercept or downweight high-risk content. It's fair to say that the first gate of most content safety strategies is composed of such classifiers.

As we can see, up to this layer, we are already able to transform "abstract semantic representations" into business-usable labels. Next, we'll discuss: when texts relate to each other, how do we perform **matching and inference**.

### 1.2.2 Text Matching: "Finding the Best Match" for a Sentence

Unlike classification, which "characterizes a single text," **text matching** focuses on "the relevance between two texts." In many products, this is often the key to achieving "intelligence": whether the system can find the most suitable entry in the knowledge base to respond to what a user said depends entirely on matching quality.

The most basic is **semantic similarity computation**. We first use the embedding model from the previous layer to encode two sentences into vectors, then judge their distance in semantic space through cosine similarity, dot product, etc. Models like SimCSE and Sentence-BERT are specifically trained through contrastive learning to pull "similar sentence pairs" closer and push "dissimilar sentence pairs" further apart.

Building on this, **paraphrase detection** and **plagiarism detection** are simply matching tasks in specific application scenarios. The former is used for content deduplication, preventing platforms from being flooded with repetitive expressions; the latter is used in education, knowledge communities, and other scenarios to identify highly similar answers or articles. Technically, they are both essentially binary classification or ranking based on text similarity.

A very important downstream application is **Q&A matching**. When a user poses a natural language question, we don't match FAQs directly with keywords, but first perform recall through semantic vectors, then use a more refined matching model (such as a Cross-Encoder) to rerank several candidates and select the most likely match. This pipeline forms the foundation of FAQ bots and document Q&A systems.

At this layer, we have acquired the ability to classify and judge relationships for "entire texts." But in many scenarios, businesses are not satisfied with this and further want to know: **which specific entities are mentioned in this text, and what events occurred**. This naturally leads to the topic of the next section — **sequence labeling and information extraction**.

## 1.3 Sequence Labeling and Information Extraction (Sequence Labeling & Information Extraction)

After completing holistic text classification and matching, we often encounter a more granular need: not only knowing "what this article is about and whether the risk is high," but also knowing "specifically who it mentions, where, when, and what amount." This section represents a key step toward "fine-grained structuring" on top of holistic judgment. You can think of it as: given that we already know "which type of text to look at and roughly what it's about," mining entities, relationships, events, and various fields from within the text, so that unstructured text can be directly consumed by business systems. We examine this layer from four perspectives — objectives, principles, models, and products:

- **Scenarios**
  - Industry text structuring: Extracting key fields such as person names, organizations, amounts, dates, and clauses from contracts, reports, announcements, medical records, policies, and other documents for database entry and retrieval.
  - Knowledge graphs and relationship networks: Identifying entities and their relationships from news, papers, and Q&A to build "who is related to whom" graphs for search, recommendation, and analysis.
  - Receipt and document processing: For invoices, statements, expense reports, etc., automatically extracting fields such as header, tax ID, amount, and date to reduce manual data entry.
  - Public opinion and event analysis: Extracting "who did what, when, and where" from massive text volumes for event tracking, risk alerts, and statistical reports.
  - Log and ticket structuring: Extracting key information from unstructured text in customer service conversations, tickets, and system logs for statistics, monitoring, and automated processing.
- **Principles**
  Performing fine-grained labeling and structuring at the token / phrase level:
  - Sequence labeling: Tagging each token (e.g., person name, place name, organization name, product name, etc.) to achieve named entity recognition, part-of-speech tagging, phrase segmentation, etc.;
  - Relation and event extraction: Identifying "entity-entity" relationships on top of entities, as well as event structures of "who did what, when, and where";
  - Business field extraction: Around specific business schemas (such as contract fields, invoice fields), converting long documents into standardized key-value pairs or record tables.
- **Models**
  Building on pretrained representations, completing information extraction through sequence labeling or span extraction structures:
  - Sequence labeling models: BiLSTM-CRF, BERT + CRF / Softmax, etc.;
  - Span-based extraction: Directly predicting start and end positions of entity / relation spans;
  - Document-level extraction: DocIE-type models that incorporate layout and page structure;
  - LLM-based extraction: Using Prompt / Few-shot to have large models extract required fields in specified formats.

### 1.3.1 Sequence Labeling: Attaching Semantic "Tags" to Each Token and Phrase

In the text classification stage, we only care about which category the entire text belongs to; in the sequence labeling stage, we need to mark each token and each phrase in the text. The most typical task is Named Entity Recognition (NER): identifying specific types of entities such as person names, organization names, place names, product names, and disease names.

- For example, in the sentence "John joined a tech company in Beijing," "John" is labeled as a person name, "Beijing" as a place name, and "a tech company" as an organization.

From a modeling perspective, the traditional approach uses BiLSTM + CRF type sequence labeling structures, later increasingly adopting BERT + CRF or BERT + Softmax, leveraging the pretrained encoder's contextual representation ability to determine each token's label (such as B-ORG, I-ORG, O, etc.). In practice, NER models often serve as the first "preprocessing" step for subsequent knowledge graphs and relation extraction.

Besides NER, part-of-speech tagging and phrase segmentation are also typical sequence labeling tasks. They primarily serve lower-level language analysis, providing basic structures for subsequent more complex syntactic / semantic tasks.

- For example, labeling "quickly improve model performance" with "quickly" as an adverb, "improve" as a verb, and "performance" as a noun for downstream analysis.

### 1.3.2 Relation and Event Extraction: Connecting "Points" into "Lines" and "Stories"

After identifying entities in text through sequence labeling, a natural follow-up question is: what relationships exist between these entities, and what events do they collectively constitute?

Relation extraction focuses on "entity pairs + relation types." For example, in the sentence "John joined a tech company as CTO in 2024," we need to not only identify "John" and "a tech company" as entities, but also extract the "employed at" relationship between them.

- Simply put, it's attaching a relation label like "employment" to the entity pair "John – a tech company."

Beyond relations, event extraction attempts to reconstruct "who did what, when, and where." Taking a news article as an example, a standard event template might include: event type (acquisition, partnership, accident), time, location, participants, amount, consequences, and other slots. Event extraction models need to automatically fill these slots from lengthy text, thereby constructing "event tables" that can be searched, statistically analyzed, and reasoned about.

- For example, extracting from "Company A acquired Company B for 500 million yuan": event type = acquisition, amount = 500 million yuan, participants = two companies.

In terms of modeling methods, beyond traditional sequence labeling-based extraction, we also adopt Span-based IE (directly predicting start and end positions of entity/relation spans) as well as recently emerging Prompt-based IE and LLM-based Few-shot extraction. The advantage of the latter is that it can quickly adapt to new schemas through natural language prompts, reducing the cost of extensive re-annotation and training.

From an engineering perspective, mature extraction systems typically form a pipeline:

- Upstream NER / sequence labeling identifies entities;
- Middle layer performs relation and event structure modeling;
- Downstream writes results into databases or knowledge graphs for consumption by search, analysis, and risk control systems.

## 1.4 Text Generation and Editing (Text Generation & Editing)

In the preceding sections, we have progressively built an understanding pipeline of "representation → classification and matching → sequence labeling and extraction": the model can not only map text to semantic space, but also make judgments about entire texts and extract structured information from them. What this section does is traverse this understanding pipeline "in reverse": on the basis of thorough understanding, have the model actively produce, rewrite, compress, and polish text. You can think of it as "reverse encoding" in semantic space, turning internal representations back into high-quality natural language output — the layer in the entire text modality capability chain closest to user perception. We still break this down from four dimensions — objectives, principles, models, and products:

- **Scenarios**
  - Daily writing and office work: Generating emails, notices, proposal drafts, or expanding, rewriting, and polishing existing text.
  - Knowledge management and summarization: Automatically summarizing long documents, reports, and meeting notes to help quickly grasp key points.
  - Customer service and Q&A: Automatically generating clearly structured, consistently toned responses based on user questions and retrieved materials.
  - Marketing and creative content: Generating ad copy, social media posts, event descriptions, scripts, etc.
  - Multilingual scenarios: Completing translation and localization rewriting while preserving the original meaning, adapting to different languages and scenarios.
- **Principles**
  Building on language modeling, performing "creation from scratch" and "modification based on existing content":
  - Free generation: Generating a complete text from scratch based on intent, prompts, or outlines;
  - Controlled rewriting: Adjusting style, length, and structure while keeping core information unchanged (such as summarization, expansion, style transfer);
  - Error correction and polishing: Fixing typos, grammar issues, and optimizing expression order and logical structure.
- **Models**
  Primarily large-scale pretrained + instruction-tuned generative models:
  - Instruction-tuned LLMs: GPT series, LLaMA / Qwen / GLM, etc., used for general generation and editing;
  - Seq2Seq models: T5, BART, mT5, etc., used for summarization, translation, format conversion, and other tasks;
  - Alignment and safety: Using RLHF / RLAIF and other methods to make generated content more aligned with instructions and safety requirements.

Since this section is essentially equivalent to prompt engineering, we won't elaborate further — you can refer to the prompt engineering tutorial on your own.

# 2. Image Modality (Image / Vision)

Among AI capabilities, the image modality is responsible for "understanding the world through vision." Whether the ultimate goal is security surveillance, autonomous driving, short video effects, e-commerce intelligent photo editing, multimodal Q&A, or AI painting, they all fundamentally follow one path: starting from raw pixels, progressively gaining structured understanding of the scene and controllable generation capabilities.

## 2.1 Low-Level Vision

In the previous section, we introduced the role of the visual modality in multimodal systems as a whole, as well as how it connects with language and speech. But before truly entering "high-level semantic tasks" like object detection, image understanding, and visual Q&A, there is a foundational capability layer that is often overlooked yet critically important — low-level vision. You can think of it as: before "understanding what's in the image," the system first needs to solve "how good is this image's quality" and "what stable local structures can be reused by upper layers," using a layer of general restoration, enhancement, and structure extraction to convert raw pixels into cleaner, more stable image representations.

From an engineering perspective, low-level vision directly affects the "visual quality experience" users see with their own eyes, and also determines whether the input distribution for upper-layer detection, recognition, segmentation, and other tasks is healthy. If this layer is done poorly, all subsequent models must struggle in environments with "heavy noise, severe distortion, and extreme lighting"; conversely, if images are repaired as much as possible and structural information is extracted well at this layer, high-level tasks can perform on a more friendly foundation. Below we examine this layer from three perspectives — scenarios, principles, and models:

- **Scenarios**
  - Cameras and capture devices: Automatic denoising, HDR, night mode, stabilization for phones/cameras, multi-frame fusion to improve detail and dynamic range.
  - Content platforms and short videos: One-click quality enhancement for uploaded images/videos, removing compression artifacts, improving clarity and contrast, enhancing subjective viewing experience.
  - Old photo and document restoration: Denoising, colorization, super-resolution for old photos; automatically straightening and enhancing tilted or dark receipts, contracts, and book pages for better OCR.
  - Surveillance and security: Denoising, dehazing, rain drop removal, resolution enhancement for low-light surveillance footage, laying the foundation for subsequent face/license plate recognition.
  - AR/VR and 3D reconstruction: Providing stable corners, edges, and local descriptors for SLAM, panoramic stitching, and 3D reconstruction, ensuring tracking and registration robustness.
- **Principles**
  Centered on two core objectives — "image quality" and "local structure" — performing physical and statistical modeling on pixel-level information:
  - Image restoration and enhancement: Assuming the observed image is an ideal image degraded by noise, blur kernels, compression, and imaging nonlinearities, performing denoising, deblurring, compression artifact removal, low-light enhancement, and super-resolution reconstruction under this assumption, making the output closer to real scene imaging while conforming to human visual perception habits.
  - Structural feature extraction: Without introducing specific semantic labels, extracting edges, corners, local textures, salient regions, and other features from pixel gradients and texture statistics, providing a "geometric skeleton" for subsequent detection, registration, tracking, and segmentation.
  - Geometric and illumination preprocessing: Based on camera models and simple geometric cues (straight lines, vanishing points, symmetry, etc.), estimating distortion and perspective relationships, through operations such as undistortion, straightening, contrast and illumination normalization, aligning the original image to a more standard and stable input space.
- **Models**
  Combining classic image processing methods and deep learning models, balancing efficiency and effectiveness:
  - Traditional image processing: Bilateral filtering, non-local means, guided filtering, Retinex, histogram equalization, Canny/LoG edge detection, Harris/FAST corners, SIFT/SURF/ORB descriptors, Hough transform, camera calibration and geometric correction, etc.
  - Deep restoration and enhancement models: CNN or Vision Transformer-based denoising, deblurring, super-resolution, rain/haze/compression artifact removal models (such as EDSR, RCAN, SwinIR, ESRGAN, etc.), as well as multi-frame/video enhancement networks, learning the mapping from degraded to high-quality images in an end-to-end manner, or using modern image editing models such as Jimeng and Qwen editing models.

### 2.1.1 Image Restoration and Enhancement: From "Visible" to "Clear"

In low-level vision, image restoration and enhancement first confront various degradations: noise, blur, compression artifacts, low light, insufficient dynamic range, etc. Raw images in many real-world scenarios are not "clean": night scenes and dim indoor lighting fill images with grain and color spots, snapshots and surveillance footage are often blurry due to motion or poor focus, and video compression introduces blocky artifacts. The goal of restoration and enhancement is to recover clear details and natural appearance as much as possible without changing the image's semantic content, turning "blurry, dark, dirty" inputs into "clear, bright, comfortable" ones.

Typical tasks include denoising, deblurring, low-light enhancement, and super-resolution. Denoising and deblurring need to balance local texture and overall structure: suppressing high-frequency noise and deconvolving blur kernel effects without smoothing away real details; low-light enhancement needs to boost brightness and contrast while avoiding amplifying dark-region noise and correcting color casts and suppressing overexposed areas; super-resolution focuses on supplementing reasonable high-frequency information during upscaling, so that the enlarged image neither looks "blurry" and "plasticky" nor excessively "fabricates" details. Modern methods mostly adopt deep networks (CNN or Vision Transformer), learning the mapping from observed image y to ideal image x on large "degraded–clear" paired datasets, using combined objectives including pixel error, perceptual loss, and adversarial loss to balance "good metrics" and "good visual appearance."

These capabilities are often invisible in products: phone camera night mode and HDR photography, one-click quality enhancement on short video platforms, old photo restoration tools, cloud-based enhancement services for surveillance systems — all essentially depend on this layer's restoration and enhancement modules. For business, they directly affect users' subjective perception of "image quality" and indirectly determine the input quality for upper-layer detection, recognition, and segmentation algorithms. It's fair to say that the more complex the upper-layer visual task, the more it depends on a high-quality, distributionally stable "image foundation" at the bottom.

### 2.1.2 Structural Features and Preprocessing: Building "Scaffolding" for High-Level Understanding

Once image quality has been restored to a usable level, the second key task of low-level vision is extracting features from pixels that are temporarily unrelated to specific semantics but are crucial for geometric structure and visual perception, and normalizing geometry and illumination. This step won't directly tell you "here is a car" or "this is someone's face," but will answer questions like "where are clear contours and corners," "which regions have prominent texture structure," and "is the image distorted or tilted," providing reliable structural input for upper-layer models.

In feature extraction, edges and corners are the most basic elements. Through operators like Canny and Sobel, the system can mark "edges" where grayscale or color changes most dramatically across the entire image — these often correspond to object contours, component boundaries, and texture directions; corner detection (such as Harris, FAST) finds "corners" where local gradients change significantly in multiple directions, typically appearing at object corners and line intersections. Furthermore, local descriptors like SIFT, SURF, and ORB encode the texture patterns of small regions around these key points, so that the same physical point can still be matched under different viewpoints, scales, and certain illumination changes, providing fundamental support for image registration, panoramic stitching, SLAM, AR tracking, and 3D reconstruction.

Running in parallel with feature extraction are various geometric and illumination preprocessing operations. Barrel/pincushion distortion from wide-angle lenses, tilt and perspective stretching when photographing documents, are all identified through low-level geometric cues such as line detection and vanishing point estimation, and "corrected back to normal" through undistortion, straightening, and perspective correction steps; global or adaptive histogram equalization, contrast stretching, and illumination normalization enhance local contrast and reduce the effects of uneven lighting and shadows while preserving details. Color space transformations (RGB→HSV/Lab) and color histogram statistics provide directly usable input for simple color-based segmentation, salient region detection, and color cast correction tasks.

After end-to-end deep learning became mainstream, some of these structural features and preprocessing steps have been "internalized" into the convolution kernels and normalization strategies of the network's early layers, no longer appearing as explicit operators on system architecture diagrams. But functionally, they still play the same role: first using a layer of relatively general, category-agnostic low-level processing to organize raw pixels into representations that are more stable in geometric form, illumination conditions, and local structure, then handing them off to upper-layer classification, detection, segmentation, and multimodal modules to complete the task of "understanding what this is." Without this "scaffolding," upper-layer models would have to struggle with noisy, distorted, structurally blurred original images, and the overall system's robustness and generalization ability would significantly decline.

## 2.2 Image Classification and Recognition (Image Classification & Recognition)

In most image tasks, what businesses truly care about is: **what category does this image overall belong to? Who is this person in the image? Is this pedestrian the same person across different cameras?** You can think of this layer as: on a unified, clean input space, attaching "category labels" or "identity labels" to entire images or entire persons/objects, transforming visual signals into the most directly usable recognition results.

From a product perspective, image classification and recognition were among the first visual capabilities to be deployed at scale, and also serve as the "entry module" for many upper-layer applications. E-commerce and content platforms use it to automatically tag images and identify main categories; security and access control systems use it to confirm "is it the same person"; pedestrian re-identification systems painstakingly trace through multiple camera feeds to find cross-scene trajectories of the same target. Below we examine this layer from three perspectives — scenarios, principles, and models:

- **Scenarios**
  - General image understanding: Automatically tagging user-uploaded images with topic labels such as "landscape / food / pet / document" for retrieval, recommendation, and content moderation.
  - Face recognition and access control: In face-based access control and attendance systems, identifying personal identity from face images to enable "face-scan entry" and "face-scan check-in."
  - Pedestrian/person re-identification: Judging whether it's the same pedestrian or person across different camera feeds for security retrieval and trajectory analysis.
  - Human attribute recognition: Without directly confirming identity, recognizing attributes such as gender, age range, whether wearing a hat/backpack/uniform, etc., providing clues for retrieval and behavior analysis.
- **Principles**
  In a unified visual feature space, performing discriminative modeling on entire images or entire persons/object:
  - Image classification: Taking the entire image as input, extracting global features through convolutional networks or Vision Transformers, and attaching a classification head at the top of the features to output single-label or multi-label category probabilities, answering "what type of image is this."
  - Identity/instance recognition: Transforming the "who is it" question into a metric learning problem in feature space, i.e., learning an embedding space where image features of the same identity are close to each other and features of different identities are far apart, then using nearest neighbor search or clustering to complete recognition and retrieval.
  - Attribute recognition: On top of shared pedestrian/human features, adding multi-task output heads to predict attribute labels such as gender, age range, clothing color, whether carrying items, etc., so that the same features can serve multiple downstream retrieval and analysis needs.
- **Models**
  Using deep convolutional networks and Vision Transformers as backbones, combined with classification heads or metric learning heads to implement different types of recognition tasks:
  - Image classification backbones: ResNet, DenseNet, EfficientNet, ConvNeXt, Vision Transformer (ViT), Swin Transformer, etc., typically pretrained on large-scale datasets such as ImageNet, then fine-tuned on specific business data.
  - General classification architecture: Backbone + fully connected classification layer (Softmax / Sigmoid) for single-label or multi-label image classification tasks, with class reweighting, focal loss, etc. to handle long-tail distributions.
  - Identity/instance recognition: On top of the backbone's feature output, using loss functions with angular constraints such as ArcFace, CosFace, SphereFace to explicitly enlarge inter-class margins between different identities, improving separability in feature space, and completing large-scale library comparison through vector retrieval (ANN).
  - Pedestrian/attribute recognition architecture: For pedestrian Re-ID and human attribute recognition, the common approach is to use a shared backbone to extract pedestrian features, then branch into an "identity branch" and an "attribute branch" at the top, optimizing both cross-camera identity discrimination and multi-attribute prediction.

In terms of specific product forms, this layer's capabilities are commonly offered as "image content recognition / classification API," "face recognition SDK / SaaS," "pedestrian re-identification platform," etc. They often both directly drive business decisions (such as access control clearance, content tag writing) and serve as upstream, providing structured labels and stable identity representations for subsequent retrieval, recommendation, behavior analysis, and multimodal understanding. Below, we expand from two angles: image classification and identity/attribute recognition.

### 2.2.1 Image Classification: Answering "What Kind of Image Is This?"

In the most basic image classification task, the system faces an entire image, and the goal is to assign one or more semantic category labels. The most common is single-label classification, for example in datasets like ImageNet where each image is annotated as "dog," "cat," "car," "airplane," etc.; in business scenarios, this capability is widely used to add topic labels such as "landscape / food / pet / portrait / document" to user-uploaded images, supporting retrieval, recommendation, and content moderation. Similar to text classification, the model attaches a fully connected + Softmax layer on top of the global visual features extracted by a pretrained backbone, outputting a probability distribution over all candidate categories.

In many practical applications, an image often belongs to multiple categories simultaneously — for example, a "seaside sunset selfie" could be "landscape," "portrait," and also tagged as "travel" and "seaside." This requires multi-label classification: the model still starts from whole-image features, but the output layer is no longer mutually exclusive Softmax; instead, it independently predicts the presence/absence probability (Sigmoid) for each label, trained with multi-label loss functions. To cope with the abundance of "long-tail categories" (very few samples for niche labels) in real-world data, multi-label classification models often incorporate mechanisms such as class reweighting, hard example mining, or label structure modeling to improve recall for niche categories.

At the human-machine interface level, image classification is typically offered as an "image content recognition API." Upstream businesses only need to upload an image to receive a set of category labels with confidence scores for subsequent policy decisions: for example, ad placement systems can restrict certain sensitive categories based on image content, e-commerce platforms can use image classification to assist product category correction, and content platforms use it to enrich recommendation features and moderation signals. Although technically this capability is relatively mature, it remains the foundation for subsequent more complex capabilities such as object detection, instance segmentation, and visual Q&A.

### 2.2.2 Image Recognition and Attribute Recognition: Answering "Who Is This / What Instance Is This?"

Unlike "what type of image is this," image recognition is more concerned with "who is this person/object in the image" — identity-level, instance-level distinction. Typical representatives are face recognition and pedestrian re-identification: the former judges "which identity in the database is closest to the current face" in access control, attendance, and payment scenarios; the latter searches across multiple cameras and different time periods of surveillance footage for the same pedestrian, assisting case investigation and trajectory analysis. The core of these tasks is no longer simple multi-class classification, but how to learn an embedding in feature space that is "compact within classes and separated between classes," so that images of the same identity captured under different poses, lighting, and cameras can still be clustered together.

In model design, face recognition and pedestrian re-identification typically adopt similar paradigms: first using backbones such as ResNet, ConvNeXt, ViT, Swin to extract face/pedestrian-centered features, then attaching loss functions specifically designed for metric learning, such as ArcFace, CosFace, etc. Unlike ordinary classification losses, these losses directly constrain inter-class boundaries in angular space or feature space, explicitly enlarging the margins between different identity features, so that the trained features can be used for large-scale vector retrieval without being limited to the fixed categories seen during training. In online service, the system first pre-computes and indexes features for each identity in the image library, then performs approximate nearest neighbor search on query face/pedestrian features to find the most similar candidates, combined with business thresholds and multimodal information for final decisions.

Corresponding to "direct identity recognition" is **attribute recognition**, which doesn't point to specific individuals. In many security and retail scenarios, the system only needs to know "male or female," "approximate age range," "wearing a hat/mask or not," "clothing color and style," "carrying a bag/pulling luggage or not" — attributes for quickly screening targets, without needing to (nor being appropriate to) directly output personal identity. Such tasks typically attach multiple parallel attribute heads (a "head" refers to the position that outputs probabilities, allowing multiple probability outputs for category judgment) on top of shared pedestrian/human features, with each head responsible for predicting one or a group of attribute labels, forming a multi-task learning framework. On one hand, multi-task training can make features richer and generalize better; on the other hand, attributes themselves can serve as auxiliary conditions for Re-ID or retrieval, improving system usability in complex scenarios.

In product form, this type of capability is typically packaged as "face recognition SDK/cloud service," "pedestrian re-identification platform," "human attribute recognition API," etc., integrated into access control gates, attendance machines, security platforms, and video structuring systems. Compared to general image classification, they have higher requirements for data security and privacy protection, and are more sensitive to the trade-off between false acceptance rate and recall rate. Therefore, beyond algorithms, they are supplemented with quality detection (such as whether it's a real person, whether it's occluded/replayed), liveness detection, and multimodal cross-validation mechanisms, forming more complete and responsible identity recognition solutions.

## 2.3 Object Detection

In the preceding image classification and recognition, we only gave an overall label to the "entire image" or "entire person," ignoring where and how large it appears in the image. However, more common in real business is the question: **what objects are in this image, and where are they?** For example, in a street view image, we want to simultaneously mark all pedestrians, vehicles, and traffic signs; on an industrial production line, we need to mark all defect regions and component positions in the same frame. Object detection was born for these needs: in a single image or video frame, it simultaneously predicts each object's **position (bounding box) and category**, serving as the foundational capability for numerous downstream visual tasks (tracking, segmentation, behavior analysis, multi-object counting, etc.).

From an engineering usage perspective, object detection is the "first structuring step" in many visual systems, decomposing a raw image into several labeled rectangular boxes, each of which can be further sent to other modules for recognition, tracking, attribute analysis, or even semantic generation. Pedestrian/vehicle detection in security cameras, product detection on unmanned retail shelves, defect/foreign object detection in industrial quality inspection, and "object detection" APIs provided by cloud vendors all fundamentally rely on this layer of capability. Below we examine object detection from three perspectives — **scenarios**, **principles**, and **models** — and expand on key directions in subsequent subsections.

- **Scenarios**
  - Security and traffic monitoring: Real-time detection of pedestrians, vehicles, non-motorized vehicles, traffic signs, wrong-way/lane-occupying objects, etc. in camera feeds, providing the foundation for subsequent behavior analysis and alerts.
  - Industrial quality inspection and manufacturing: Detecting product defects (scratches, damage, foreign objects), component positions, and assembly completeness on production lines, supporting automatic rejection and robot positioning.
  - Retail and logistics: Unmanned retail shelf product detection and checkout; detection and localization of packages, pallets, and stacked goods in warehouses, assisting inventory checks and robot grasping.
  - Content understanding and moderation: Detecting people, logos, weapons, sensitive objects, etc. in images/videos, providing structured signals for content moderation, advertising compliance, and brand recognition.
- **Principles**
  The core of object detection is building a dense prediction mechanism on images:
  - Extracting the input image into multi-scale feature maps through a backbone, and on these feature maps, simultaneously predicting for each "position" (or candidate region) "whether there is an object," "what category it is," and "the corresponding bbox parameters."
  - By architecture, there is **two-stage detection** that first generates candidate boxes then refines them, and integrated **one-stage detection** that directly performs classification + regression on feature maps, each with different emphases on accuracy and speed.
  - By candidate box design, there are **anchor-based** methods relying on predefined anchor boxes, **anchor-free** methods that directly predict center points/boundaries, and the **DETR family** based on set matching.
  - To handle small objects, dense objects, occlusion, and scale variation in real-world data, detectors typically combine multi-scale features (FPN), higher resolution inputs, specific loss functions, and post-processing strategies (such as NMS variants, multi-scale testing) for optimization.
- **Models**
  Detection models broadly consist of three parts: **backbone network + feature pyramid / head structure + loss and post-processing**:
  - Classic two-stage detectors: Faster R-CNN, Mask R-CNN, etc., first generating candidate boxes through RPN, then performing fine classification and regression on each candidate region — high accuracy, clear structure, suitable for scenarios requiring extreme precision.
  - One-stage detectors: SSD, RetinaNet, YOLO series (YOLOv5/6/7/8, YOLOX, YOLOv10, etc.), completing detection in a unified network — compact structure, low latency, the mainstay of real-time detection in industry.
  - Anchor-free / Transformer detectors: FCOS, CenterNet, ATSS, etc. directly predict boxes centered on pixel points; DETR / Deformable DETR treat detection as "generating a set of objects from a set of queries" through Transformer and set matching, simplifying many hand-crafted components.
  - Video detection and tracking: Building on image detectors by introducing temporal information and association strategies (such as tracking heads, optical flow, trajectory matching), forming unified Detection + Tracking frameworks to support long-duration, multi-object behavior analysis.

Overall, object detection occupies a "central position" in the visual capability spectrum — on one hand receiving clean image input from low-level vision, on the other hand deconstructing images into "object-level" elements usable by recognition, tracking, segmentation, and multimodal understanding. Below, we expand from three directions: **single/two-stage detection architectures**, **anchor-based / anchor-free / Transformer detection**, and **small object and video detection**.

### 2.3.1 One-Stage and Two-Stage Detection: Accuracy–Speed Structural Trade-offs

Architecturally, the most classic division in object detection is **two-stage vs. one-stage**. The main difference is: whether to first "roughly select a batch of candidate boxes, then refine" or to "predict all boxes and categories at once" on the feature map.

Two-stage detection is represented by Faster R-CNN. It first generates a batch of "high-probability object-containing" candidate boxes on the backbone feature map through RPN (Region Proposal Network) (first stage), then performs RoI alignment and feature extraction on each candidate region, followed by more refined classification and bounding box regression (second stage). The advantage of this design is: a large number of negative samples are filtered out at the RPN stage, and the second stage can focus on making high-quality judgments on fewer candidate regions, thus often having an accuracy advantage and being easier to extend to instance segmentation (Mask R-CNN), keypoint detection (Keypoint R-CNN), and other tasks. However, the computational and implementation complexity of multi-stage structures is relatively higher, making them more suitable for offline or near-real-time scenarios that don't have stringent real-time requirements but emphasize accuracy and extensibility.

One-stage detection aims to streamline the entire process, completing category classification and bounding box regression simultaneously in a unified network. Representative models include SSD, RetinaNet, and the YOLO series: they directly predict "foreground/background + category + bbox" for several candidate boxes at each position on multi-scale feature maps, eliminating the explicit proposal stage and being more suitable for end-to-end acceleration and deployment. Early one-stage detectors had a certain accuracy gap compared to two-stage, but凭借 simple structure and fast speed, quickly gained dominance in industry; with the introduction of FPN, focal loss, IoU-aware loss, and stronger backbones and necks, newer models such as RetinaNet, YOLOX, YOLOv7/8/10 have achieved "approaching or even surpassing two-stage" accuracy-speed balance on many tasks.

At the application level, engineers typically choose between these two architectures based on requirements: for cloud-based batch offline analysis and tasks requiring high accuracy and extensibility (such as simultaneous detection + segmentation + keypoints), two-stage detection remains a stable and reliable choice; while for edge devices, mobile applications, real-time camera detection, and other latency-sensitive scenarios, one-stage detectors like the YOLO series are almost the default choice, often combined with quantization, pruning, distillation, and other techniques to further compress the model and improve throughput.

### 2.3.2 Anchor-based and Anchor-free: From Manual Design to End-to-End Learning

On the question of how to define "candidate boxes," detection methods can be divided into **anchor-based and anchor-free** categories. Early mainstream methods (such as Faster R-CNN, SSD, RetinaNet, YOLOv3/v4/v5, etc.) adopted the anchor-based approach: predefining several anchor boxes with different scales and aspect ratios at each position on the feature map, then learning the foreground probability and bbox offset for each anchor. This approach is simple to implement and effective, but requires significant manual tuning of anchor sizes and ratios, and is prone to issues with massive anchor counts and extreme positive/negative sample imbalance in small object and dense object scenarios.

Anchor-free methods attempt to eliminate the dependence on predefined anchors. Represented by FCOS, CenterNet, ATSS, etc., they typically directly predict "whether this is the center of (or belongs to) some object" and the corresponding boundary distances at each pixel point on the feature map, completely avoiding the complexity of preset anchors. The benefits are: cleaner model structure, more natural training sample allocation strategies, and better generalization and extensibility, especially when facing real-world scenarios with large scale variation and complex object shapes. Meanwhile, anchor-free detectors have also promoted more unified pixel/point-based frameworks, making it easier to jointly model detection with keypoint, segmentation, and other tasks.

Going further, Transformer-based detectors like DETR / Deformable DETR rethink the detection problem from another dimension: instead of densely placing anchors on feature maps, they introduce a fixed number of "object queries," using Transformer's self-attention and cross-attention mechanisms to "generate" a set of object predictions from global features, aligned one-to-one through Hungarian Matching. This set prediction approach completely eliminates traditional components like NMS and manual sample assignment, conceptually very clean, but early implementations suffered from slow convergence and poor small object performance; subsequent Deformable DETR introduced deformable attention and multi-scale mechanisms, significantly improving convergence speed and performance, gradually gaining more applications in detection and multi-task scenarios.

For engineering practice, anchor-based, anchor-free, and Transformer detection are not mutually exclusive choices, but rather more like an evolutionary chain: from heavily engineered anchor design, to more end-to-end point/center prediction, to fully set-prediction-and-attention-based unified frameworks. In current industrial deployment, mature anchor-based models like the YOLO series remain the mainstay, while anchor-free and DETR family models appear more in systems requiring structural simplicity, multi-task unity, and extensibility.

### 2.3.3 Small Object and Video Detection: Toward Real-World Robustness

Object detection on public datasets often gives the illusion that "the problem is basically solved," but once entering real-world scenarios, two types of challenging problems immediately arise: **small/dense objects** and **robust detection and tracking in video**.

In small object detection, objects often occupy very few pixels in the original image, such as distant pedestrians, faraway vehicles, aerial drones, or tiny defects in high-resolution industrial images. As backbone downsampling and feature map resolution decrease, these small objects can easily be "submerged" in high-level features, leading to missed detections. To address this, detectors typically adopt multi-scale feature pyramids (FPN/PAFPN, etc.), increase input resolution, add detection heads on shallow feature maps, and even design specialized branches and loss weighting strategies for small objects. At the data level, techniques such as cropping, magnification, and small object resampling are also needed to improve the model's perception and memory of small-scale objects.

Dense objects (such as crowded scenes, packed parking lots, tightly arranged products/parts) expose problems like anchor box overlap, NMS false suppression, and severe occlusion. Improvement strategies include more refined label assignment (such as adaptive assignment methods like ATSS), soft NMS or learning-based deduplication strategies, and modeling through center points/density maps to alleviate inter-box competition. In industrial quality inspection, many systems also combine detection with pixel-level segmentation for more precise defect localization to facilitate subsequent automatic handling.

When detection extends from single frames to video, another challenge is **temporal continuity and object stability**. Single-frame detectors make independent predictions on each frame, inevitably causing short-term missed detections, ID jitter, and false alarms, while real-world applications such as alerts, counting, and trajectory analysis often require cross-frame consistent object trajectories. To address this, video object detection typically adds a tracking module, connecting "detection + object tracking": the classic approach uses an image detector as the front end, with Kalman filtering, Hungarian matching, appearance feature similarity, etc. at the back end for multi-object tracking (such as SORT, DeepSORT, etc.); more advanced approaches integrate tracking heads directly into the detection network, jointly learning detection and cross-frame association, improving robustness in scenarios with short-term occlusion and rapid motion.

In real systems, small objects, dense objects, and video detection are often not isolated problems but appear simultaneously: for example, distant pedestrians/vehicles in urban road surveillance, dense crowds in station plazas, high-speed moving parts in production line videos. This determines that high-quality object detection modules, beyond having impressive metrics on standard benchmarks, must withstand various complex factors under real-world conditions of multi-scale, multi-density, and long-duration video to truly support upper-layer behavior analysis, intelligent alerting, and multimodal understanding.

## 2.4 Image Segmentation

With object detection, we can already know "what objects are in the image and roughly where they are," but many tasks require more fine-grained structural understanding: **down to every pixel, determining which category and which instance it belongs to**. For example, in autonomous driving, we need to know which pixels are road, which are people and vehicles; cutout tools need to cleanly separate hair strands from background; medical images require precisely tracing tumor and organ boundaries. These tasks are collectively called image segmentation, which directly outputs semantic or instance labels at the pixel level, providing finer-grained spatial structure information than detection.

From a product perspective, image segmentation is the core capability of "pixel-level structuring": cutout and background replacement tools depend on it to determine which pixels to keep; autonomous driving perception modules depend on it to build detailed "drivable area + obstacle" maps; medical imaging software depends on it to measure lesion size, shape, and volume; remote sensing platforms depend on it to distinguish farmland, water bodies, buildings, roads, and other land features. Below we examine image segmentation from three perspectives — **scenarios**, **principles**, and **models** — and expand on semantic/instance/panoptic/foundation model segmentation directions in subsequent subsections.

- **Scenarios**
  - Content editing and cutout: Portrait cutout, hair-level background replacement, object extraction and layered editing for photo beautification, short video effects, and ad creative production.
  - Autonomous driving and robotics: Labeling each pixel as road surface, lane markings, pedestrians, vehicles, barriers, buildings, sky, etc. for path planning, collision warning, and environment modeling.
  - Medical image analysis: Precisely segmenting organs, tumors, and lesion regions in CT, MRI, ultrasound, and other images to support assisted diagnosis, surgical planning, and treatment evaluation.
  - Remote sensing and geographic information: Segmenting farmland, water bodies, roads, buildings, woodland, and other land features in satellite/aerial images to support land planning, land use monitoring, and disaster assessment.
- **Principles**
  Image segmentation is essentially "dense prediction": extracting multi-scale features from the input image through an encoder (backbone), then progressively restoring the feature maps to the same size as the input through a decoder or upsampling module, outputting a semantic or instance label at each pixel position.
  - **Semantic Segmentation**: Assigning each pixel a semantic category (e.g., road, person, car, sky) without distinguishing different individuals of the same class, suitable for describing "scene composition."
  - **Instance Segmentation**: Further distinguishing different instances of the same class on top of semantic information, generating independent masks for "each car, each person" — a combination of detection and segmentation.
  - **Panoptic Segmentation**: Unifying "countable objects (things, such as people, cars)" and "uncountable backgrounds (stuff, such as road, sky)," providing each pixel with both a semantic label and an instance ID.
    Compared to detection, segmentation is more sensitive to spatial details and boundary quality, requiring richer multi-scale contextual information and more refined upsampling/fusion strategies.
- **Models**
  From classic to latest segmentation models, the evolution roughly follows "FCN → encoder–decoder → multi-scale context → detection + segmentation integration → foundation model segmentation":
  - Semantic segmentation: FCN, U-Net and its variants, DeepLab series (DeepLabv3/v3+), PSPNet, etc., obtaining multi-scale context and fine boundaries through dilated convolutions, pyramid pooling, skip connections, etc.
  - Instance/panoptic segmentation: Mask R-CNN, Panoptic FPN, Mask2Former, etc., combining detection heads with segmentation heads for object-level and panoptic segmentation.
  - Foundation models and universal segmentation: Foundation segmentation models such as Segment Anything Model (SAM), elevating segmentation from "training separately for each task" to "one model adapting to most segmentation scenarios," supporting interactive, prompt-based segmentation.

Overall, image segmentation provides finer spatial structural expression than object detection, making it an indispensable component for building highly reliable perception systems and advanced editing tools. Below, we expand from three directions: **semantic and instance segmentation**, **panoptic segmentation and detection integration**, and **universal segmentation**, **foundation models**, **and unsupervised segmentation**.

### 2.4.1 Semantic and Instance Segmentation: From "Pixel Categories" to "Pixel Instances"

The goal of **Semantic Segmentation** is to assign each pixel in an image a semantic category, so that the network learns "this region is road, that region is car, here is a person, over there is sky and buildings." The classic approach typically adopts an encoder–decoder structure: the encoder (such as ResNet, EfficientNet, Swin Transformer, etc.) extracts progressively downsampled high-level features, and the decoder combines coarse high-level semantic features with low-level details through upsampling, skip connections, and multi-scale fusion, restoring to original resolution. FCN first systematized this dense prediction form; U-Net achieved enormous success in medical imaging through its symmetric U-shaped structure with extensive skip connections; the DeepLab series expanded receptive fields without reducing resolution through dilated convolutions and ASPP (Atrous Spatial Pyramid Pooling); PSPNet captured global contextual information through pyramid pooling. These models collectively drove large-scale applications in road scenes, remote sensing, medical, and other fields.

**Instance Segmentation** further distinguishes different individuals of the same class on top of pixel semantic labels: not just knowing which pixels are "car," but also knowing which specific car each pixel belongs to. The most representative model is Mask R-CNN, which adds a parallel segmentation branch to the Faster R-CNN detection framework: first predicting each candidate box's category and position through the detection head, then generating a binary mask within each box, obtaining "box + mask" object-level segmentation results. Compared to pure semantic segmentation, this approach handles object overlap and occlusion well, serving as the foundation for portrait/product cutout, multi-object counting, and fine-grained editing tasks. Subsequent instance segmentation methods have continuously improved in mask quality, multi-scale handling, and speed, with new architectures based on anchor-free and Transformer emerging, but the "detection + local segmentation" approach remains very mainstream.

At the product level, semantic segmentation typically appears in "scene-level" applications such as autonomous driving road segmentation, remote sensing land feature identification, and medical organ segmentation; instance segmentation is more commonly used for "object-level" cutout, counting, and editing, such as one-click selection and separation of each car, person, or product. Combined, they can provide both fine-grained and structured spatial information for upper-layer tasks.

Semantic segmentation alone merges all objects of the same class together (all "car" pixels belong to the same class); instance segmentation alone typically only focuses on countable "things" (such as people, cars, animals) while ignoring large areas of uncountable "stuff" (such as road, grass, sky). In many scenarios, we need both **instance-level masks for each object** and an understanding of the **overall scene composition**. This gave rise to **Panoptic Segmentation**: providing each pixel with both a semantic class and an instance ID, achieving unified modeling of things + stuff.

Early panoptic segmentation systems were typically implemented through "semantic segmentation model + instance segmentation model + post-processing synthesis": first using one network to predict each pixel's semantic category, then another network to output each instance's mask and category, finally merging the two through a set of rules (such as priority, overlap handling) into a consistent panoptic segmentation result. Panoptic FPN represents a more elegant engineering path: mounting semantic and instance segmentation heads on a shared backbone and feature pyramid (FPN), obtaining both outputs simultaneously through joint training and feature sharing, then fusing them through lightweight post-processing. This not only improves efficiency but also enhances consistency between semantics and instances.

At the model level, with the development of detection/segmentation integration and Transformer architectures, unified panoptic segmentation frameworks like Mask2Former have emerged: they tend to use a universal "query + mask decoder" structure, simultaneously predicting semantic, instance, and even other downstream task masks within the same network, significantly simplifying the system architecture and facilitating multi-task extension. For complex tasks such as autonomous driving, robot navigation, and AR scene understanding, panoptic segmentation provides a complete scene description closer to "human subjective perception," enabling upper-layer decision-making and planning to proceed on more accurate spatial semantics.

In product form, panoptic segmentation is often embedded in autonomous driving, robotics systems, and high-end visual analysis platforms. Users may not directly perceive the concept of "panoptic segmentation," but genuinely benefit from more robust scene understanding and more natural interactive experiences.

### 2.4.2 Universal and Unsupervised Segmentation: From Task-Specific to "Segment Anything"

Traditional segmentation models are typically trained around specific datasets and tasks: such as "19-class semantic segmentation for road scenes," "a certain tumor segmentation," "certain product category segmentation," etc. — requiring re-annotation and retraining every time the task changes. In real business, this strong dependence on precisely annotated data is enormously costly and difficult to cover long-tail categories and continuously emerging new scenarios. In recent years, with the development of large-scale pretrained vision models and prompt-based paradigms, **universal segmentation foundation models** represented by **Segment Anything Model (SAM)** have emerged, attempting to elevate segmentation capability from "task-specific" to "infrastructure."

Taking SAM as an example, it learns universal full-image features through a powerful image encoder (typically a large-scale pretrained ViT), then converts user-provided points, boxes, text prompts, etc. into segmentation results through a lightweight prompt encoder and mask decoder. During training, SAM leverages massive, multi-source, multi-task mask annotations, so that what the model learns is a "generalized segmentation ability" rather than rote memorization of a specific dataset's labels; during inference, users only need to provide minimal prompts (a point or a rough box) to obtain high-quality masks on various unseen image types and object categories. This paradigm greatly lowers the barrier to building new segmentation applications and provides powerful tools for unsupervised/weakly supervised scenarios.

Related to this is the broader **unsupervised / self-supervised segmentation** direction: relying on no or very few manual masks, automatically dividing images into meaningful regions through signals such as internal image similarity, temporal consistency, and multi-view constraints. Early work mostly focused on "visual clustering" and proposal generation; today it is more internalized by foundation models as a representation learning approach, providing good initialization for downstream segmentation tasks. Combined with text-image contrastive learning models like CLIP, increasingly many methods can perform zero-shot or few-shot segmentation "given only text class names without mask annotations," providing new solutions for cold-start scenarios and long-tail categories.

In actual products, universal segmentation foundation models often appear as "interactive cutout tools," "intelligent selection," "one-click background removal," etc., and are also gradually being integrated into professional software in medical, remote sensing, industrial, and other fields as accelerators for semi-automatic annotation and assisted segmentation. Compared to traditional custom models, they may not achieve the ultimate on a specific task, but have significant advantages in "being able to do a bit of everything and rapidly deploying across multiple scenarios," also laying the foundation for subsequent construction of truly multimodal foundational vision models.

## 2.5 Keypoint Detection and Action Recognition (Keypoint Detection & Action Recognition)

After classification, detection, and segmentation, we can already know "what's in the image, where it is, and what each pixel belongs to." But in many real tasks, businesses care not just about "object existence and position" but about **pose and action**: Is a person walking or running? Is this hand raised, making a specific gesture? Is a worker properly wearing safety equipment and performing standard motions? Is an athlete's technique up to standard? These questions require us to further understand **the internal structure and temporal changes of objects**.

Keypoint detection and action recognition are two capability layers addressing this need:

- **Keypoint Detection**: On images or video frames, predicting several "skeleton points" (such as joints, fingertips, facial features) of a target (typically human body, hand, face, or specific mechanical structures), obtaining a fine-grained structured pose representation.
- **Action Recognition**: Analyzing changes in these keypoints or appearance features over time temporally, determining "what action or behavior this person/group is performing."

From a product perspective, this capability widely serves: human-computer interaction (gesture control), sports analytics (technique evaluation), security (fall detection, fighting/running anomaly detection), industrial safety (violation detection), virtual character driving (driving 3D skeletons and animation via body/facial keypoints), and other scenarios. Below we examine this capability layer from three perspectives — **scenarios**, **principles**, and **models** — and expand on keypoint detection and action recognition in subsections.

- **Scenarios**
  - Human-computer interaction and AR/VR: Through gesture recognition and body pose detection, enabling "control by gesturing" natural interaction, or real-time driving of virtual avatars in AR/VR.
  - Sports training and motion analysis: Tracking keypoints and analyzing angles for actions such as running, high jump, basketball shooting, and weightlifting, providing technique evaluation and correction suggestions.
  - Security and public safety: Detecting falls, fights, vigorous running, fence climbing, and other anomalous behaviors for timely alerts; identifying whether operations are up to standard on construction sites and in factories.
  - Industrial and human-robot collaboration: Detecting whether workers operate in standard postures, maintain safe distances during robot collaboration, and whether dangerous motions occur.
  - Facial/expression driving and virtual humans: Capturing expression details through facial keypoints for expression transfer, digital human driving, video conference virtual avatars, etc.
- **Principles**
  The two types of tasks respectively emphasize spatial structure and temporal changes, but fundamentally both perform structured prediction in high-dimensional feature space:
  - Keypoint detection: Localizing a set of predefined keypoints on images (such as 17/25 body joints, 21 hand joints, 68/106 facial keypoints), commonly by predicting a heatmap for each keypoint type on the feature map, then deriving coordinates from peak positions; in multi-person scenarios, "assembling joints to people" is also needed.
  - Single-frame/short-duration action recognition: Based on a single image or short time window, using body pose (keypoints) and appearance features to determine the action category occurring in that frame/segment (such as walking, running, raising hand, waving, sitting down, etc.).
  - Temporal action recognition: Over longer time scales, analyzing feature sequences (image features, keypoint sequences, optical flow, etc.), modeling the onset, duration, and end of actions, recognizing complex behaviors such as "making a phone call," "doing push-ups," "two people pushing each other."
  - Structured representation: Keypoint sequences provide a more compact and stable structured representation than raw pixels, facilitating handling of viewpoint changes, background interference, and appearance differences in action recognition.
- **Models**
  Common models roughly follow the unified paradigm of "convolution/Transformer feature extraction + keypoint/temporal head":
  - Keypoint detection: OpenPose series, Hourglass Network, HRNet, based on two major branches: top-down (detect people first, then estimate pose) and bottom-up (detect joints first, then assemble); recently Transformer-based pose estimators have also emerged.
  - Video action recognition: 2D/3D CNN-based video models (I3D, SlowFast, etc.), skeleton-based GCN models (ST-GCN, etc., directly modeling spatiotemporal relationships on keypoint graphs), and end-to-end video Transformer solutions (Video Swin, TimeSformer, etc.).
  - Unified multi-task and foundation models: Outputting detection, segmentation, keypoints, and action labels simultaneously on a universal vision backbone, or using multimodal foundation models to directly understand "what action this person is doing" through text prompts, connecting structured prediction with semantic understanding.

Below we expand from two directions: **keypoint detection and pose estimation** and **action recognition and behavior understanding**.

### 2.5.1 Keypoint Detection and Pose Estimation: "Drawing Skeletons" for People and Objects

Keypoint detection (also commonly called Pose Estimation) focuses on **spatial structure in a single frame or image**: finding a set of semantically meaningful keypoints in a 2D image and connecting them into a skeleton. For example, in human pose estimation, we typically need to detect joints such as head, shoulders, elbows, wrists, hips, knees, and ankles; in facial pose, it's eye corners, mouth corners, nose tip, face contour, etc.; in hand pose, it's finger bases, finger joints, and fingertips. For non-human objects such as robotic arms and jointed structures, a similar keypoint system can also be defined.

In model design, the commonly used paradigm for keypoint detection is **"feature extraction + heatmap prediction"**:

- First use CNN or Vision Transformer (such as ResNet, HRNet, Swin, etc.) to extract multi-scale features from the input image.
- Then through a decoding head or multiple convolution layers, output a heatmap for each keypoint type, where each pixel value represents "the probability that this position is this keypoint."
- During inference, typically take the peak position of each heatmap as the keypoint coordinate, and perform sub-pixel optimization through bilinear interpolation, local fitting, etc.

For multi-person scenarios, pose estimation methods roughly fall into two categories:

- **Top-down**: First use a pedestrian detector to find each person's bounding box in the image, then perform single-person pose estimation within each box. This approach has high accuracy for single persons and a simple framework, but has high computational cost in dense multi-person scenarios and is sensitive to detection quality. Representative systems include many combinations based on Faster R-CNN/YOLO + Hourglass/HRNet.
- **Bottom-up**: Without first distinguishing each person, directly predict all potential keypoints (and their types) across the entire image, simultaneously predicting connections between keypoints or affinity fields (such as OpenPose's PAF). Then assemble keypoints into multiple independent body skeletons through graph matching/clustering algorithms. This type of method is more efficient in dense multi-person scenarios and more robust to the number of people, but the assembly process is complex and sensitive to connection quality.

In recent years, Transformer-based pose estimation models have also gradually emerged, treating keypoint detection as a set of "query–response" tasks, similar to DETR, capable of unifying object detection and pose estimation architecturally. In engineering applications, keypoint detection capability is typically encapsulated as "body/hand/facial keypoint SDK or API" — upstream applications only need to input images or video frames to obtain structured skeleton coordinates for subsequent action recognition, interaction control, or animation driving.

### 2.5.2 Action Recognition and Behavior Understanding: Making "Skeletons" Move

After obtaining keypoints or high-level visual features, the next step is understanding **changes over the temporal dimension** — that is, Action Recognition and Behavior Understanding. Unlike keypoint detection, action recognition is not limited to single frames; it concerns the evolution patterns of features over a period of time: from "raising hand" to "waving," from "walking" to "running," from "standing" to "falling."

In terms of input representation, there are roughly three approaches:

- **Based on raw video frames / optical flow**: Directly modeling video frame sequences, or additionally introducing optical flow (a field describing local motion velocity) as input, allowing the model to jointly learn from appearance + motion information.
- **Based on skeleton/keypoint sequences**: First using pose estimation to obtain body keypoint coordinate sequences, then modeling on "spatiotemporal skeleton graphs," reducing background and lighting interference and focusing more on body structure and motion patterns.
- **Multimodal fusion**: Incorporating video features, keypoint sequences, and even audio, text, and other modalities together to handle complex behavior scenarios (such as multi-person interactions, event-level actions).

Correspondingly, model structures have diversified:

- Early action recognition mainly relied on **2D CNN + temporal pooling** or **3D CNN** (such as I3D, C3D): the former extracts features from each frame then performs temporal pooling or RNN; the latter directly performs 3D convolution in both spatial and temporal dimensions to capture short-term motion patterns.
- For skeleton sequences, the typical method is **Spatiotemporal Graph Convolutional Networks (ST-GCN)**: treating body keypoints as graph structure nodes, connections between joints as edges, also connecting edges in the temporal dimension, propagating information on the spatiotemporal graph through graph convolution to learn action patterns. These methods are lightweight, robust to background, and suitable for deployment on resource-limited devices.
- In recent years, **Video Transformers** (such as TimeSformer, Video Swin) have shown outstanding performance in action recognition, dividing videos into spatiotemporal patches and modeling long-term dependencies through self-attention mechanisms, better capturing complex actions and multi-object interactions.

On the business side, action recognition is often combined with detection, tracking, and keypoint detection to form end-to-end behavior analysis systems:

- In security, first detecting and tracking people, then performing action classification on each trajectory's keypoint sequence for fall detection, fighting/running recognition, etc.;
- In sports and fitness applications, analyzing whether actions are standard and whether the range is appropriate through keypoint sequences, providing correction suggestions;
- In human-computer interaction scenarios, performing lightweight action classification on real-time pose streams for waving, heart gesture, gesture commands, and other interactions;
- In industrial safety, continuously monitoring worker operational motions, identifying dangerous postures (such as bending into danger zones, crossing safety lines, etc.).

Looking forward, multimodal foundation models are elevating "action recognition" to a higher level of "event and intent understanding": models can not only label "walking, running, making a phone call" but also answer questions like "this person seems to be beckoning someone" or "these two people appear to be having a dispute" — descriptions closer to everyday language. Keypoint detection and action recognition serve as important structured motion cues within this, together with appearance features and language prompts, jointly supporting more complex spatiotemporal understanding capabilities.

## 2.6 Open-Vocabulary / Open-World / Open-Domain Detection

The detection and segmentation capabilities discussed so far have generally defaulted to one premise: **the set of categories during training and inference is fixed**. That is, the model has completely seen "all categories to be recognized" during training, and inference only requires choosing from this closed set of labels. But the real world is far more complex than datasets: new products, new brands, new road signs, new species, and new scenarios appear constantly, and it's impossible to prepare sufficient annotated data and retrain detectors for every new class. This has driven **open-vocabulary / open-world / open-domain detection**: when training data only covers limited "known classes," enabling the model to still perceive, localize, and recognize **unseen new classes** during inference, while maintaining robustness when visual styles and capture domains change.

You can think of this layer as: adding "alignment and generalization ability to language space and the open world" on top of traditional detection. The model no longer just says "this is one of 80 COCO classes" but can understand and retrieve objects in a space of arbitrary text descriptions, such as "detect all 'red sneakers' in the image" or "mark all 'suspected small flying devices,'" even if these fine-grained categories never explicitly appeared in the training set. Below we examine this layer from three perspectives — **scenarios**, **principles**, and **models** — and expand on open-vocabulary detection, open-world detection, and open-domain generalization in subsections.

- **Scenarios**
  - General scene understanding API: Users provide arbitrary natural language descriptions (category words or short sentences), and the system returns detection boxes or segmentation masks for corresponding targets in images of any style, such as "all safety helmets in the image," "all suspected brand logos," "all objects with wheels."
  - Large-scale product / species recognition: Continuously added long-tail products in e-commerce, vast numbers of plant and animal species in nature — training data can only cover some known classes, but the system needs to localize and roughly identify massive new classes and support text or image retrieval.
  - Cross-domain security / autonomous driving perception: Training data mostly comes from daytime urban roads / a few camera angles, but actual deployment faces different cities, rural areas, highways, extreme weather, infrared/fisheye cameras, and other "new domains," where new types of targets never annotated in the training set also appear (new car models, new traffic facilities, new types of obstacles).
- **Principles**
  The core of these methods is using a **vision–language aligned embedding space** to replace the traditional "fixed one-hot category head," and handling "unseen classes" and "new domains" through various mechanisms:
  - Open-Vocabulary Detection: During training, using large-scale image-text pairs to pretrain a CLIP-like aligned space, so that image regions and text embeddings can directly perform similarity matching in the same semantic space; the detection head no longer outputs fixed category logits but outputs a region feature vector for comparison with arbitrary text description vectors, thus supporting "training sees only some classes, inference can specify any text class."
  - Open-World Detection: Further handling "completely unannotated new classes in the training set," requiring the model to detect such targets as "unknown class," and subsequently through interactive annotation or continual learning, gradually incorporating these unknown classes into the known class set, forming an online learning system that can continuously expand categories.
  - Open-Domain / Cross-Domain Detection: Facing significant changes in image style, capture device, environmental conditions, etc. (domain shift), using Domain Adaptation, Domain Generalization, and other techniques to keep the detector maintaining stable detection performance in unseen new domains; common methods include adversarial domain alignment, multi-domain training, style randomization, meta-learning, etc.
  - Open-vocabulary segmentation integrated with detection: Extending the above ideas to pixel level, generating segmentation masks for arbitrary text descriptions (open-vocabulary segmentation), achieving "describe a region/object in natural language and get the corresponding mask or box" through Region-Word or Mask-Word alignment losses.
- **Models**
  Current mainstream technical routes for open-vocabulary / open-world / open-domain detection basically revolve around "large-scale vision-language pretraining + detection head adaptation + domain generalization mechanisms":
  - CLIP-based detectors: Based on CLIP-style image and text encoders, applying contrastive learning and Region-Word alignment losses between region-level features (ROI, feature map patches, mask regions) and text embeddings; typical implementations include replacing or extending classification heads on Faster R-CNN / RetinaNet / YOLO / DETR architectures to output category scores via "cosine similarity + text embeddings."
  - Caption-driven / Prompt-based Detection: Using large-scale image-text caption data to automatically generate text descriptions for regions or masks in images, then aligning these auto-generated texts with detection/segmentation regions during training, reducing dependence on manual category labels; inference is driven by natural language prompts (such as "all people wearing red clothes," "all electric vehicles").
  - Open-World Detection series: Explicitly introducing "unknown class" modeling, progressive category expansion, and incremental learning mechanisms in traditional detection frameworks; some methods determine "whether it's an unknown class" through metric space distance and uncertainty estimation, while others introduce memory banks and online retraining to enable the system to accumulate new category knowledge over time.
  - Domain adaptation / domain generalization detection: Adding domain discriminators, adversarial losses, multi-domain batch normalization, style randomization augmentation, and other modules at the backbone and detection head levels to make the detector learn more domain-invariant representations across different domains; some work also introduces multi-source domain training and meta-learning strategies on Transformer detection frameworks (such as Deformable DETR) to improve cross-domain generalization.
  - Universal / Foundation detection models: Elevating the detection problem to the "foundation model" level, pretraining a Detection Foundation Model that is as universal as possible in both categories and domains, then adapting to specific scenarios through lightweight fine-tuning or text prompts; such models typically combine large-scale detection annotations, multi-source image-text pairs, and even video data, with the goal of making "arbitrary text + arbitrary style image" universal understanding possible.

In specific product forms, open-vocabulary/open-world/open-domain detection often manifests as "more natural, less restrictive" visual interfaces: users don't need to pre-agree on a small set of fixed labels but can describe targets in natural language; the system also doesn't need to retrain detectors from scratch for each business scenario but can quickly adapt through prompts or a few samples based on a unified universal model. For large-scale product/species recognition and globally deployed security and autonomous driving perception systems, this capability layer is becoming a key springboard from "closed dataset performance" to "real open-world usability."

### 2.6.1 Open-Vocabulary Detection: From Fixed Category Heads to Text-Driven Category Spaces

The starting point of **Open-Vocabulary Detection** is breaking through the limitation of "fixed category heads" in traditional detection. Previous detectors attach a fixed-size classification layer at the top (corresponding to N categories in the training set), and after training can only choose among these N categories; open-vocabulary detection introduces a **text encoder** and a **shared semantic embedding space**, allowing region features output by the detection head to be compared for similarity with arbitrary text descriptions, thus accepting unseen new classes during inference.

The typical approach uses a CLIP-like vision-language pretrained model:

- Text side: Encoding category names or natural language descriptions (such as "person," "red sports car," "yellow construction helmet") to obtain text vectors.
- Visual side: In detection frameworks (Faster R-CNN, RetinaNet, YOLO, DETR, etc.), extracting region feature vectors for each candidate region or feature point.
- Alignment training: Through contrastive loss and Region-Word alignment loss, bringing text and region features of the same semantics closer in the embedding space and pushing apart vectors of different semantics. During training, even if explicit box annotations are only provided for some categories, image-text pairs or image captions can be used to expand semantic coverage.

During inference, the system no longer depends on a fixed set of class names from training, but allows users to provide arbitrary category words or natural language descriptions online, converting them to embeddings through the text encoder, then performing similarity matching with region features. This enables the detector to support flexible needs such as "detect all skateboards," "detect all green plants," "detect all safety-related equipment" without retraining, even if some specific categories never had complete annotations in the training set — as long as there is semantic overlap with the pretrained image-text space, they can be recognized and localized to some extent.

In engineering practice, open-vocabulary detection needs to balance effectiveness and efficiency: on one hand, maintaining semantic alignment with the large-scale pretrained vision-language backbone; on the other hand, meeting detection tasks' requirements for multi-scale and real-time performance. Mainstream CLIP-based detectors often adopt "pre-computed text embeddings + efficient vector similarity computation" to avoid repeatedly encoding text in online service, while quantizing or distilling region features to balance accuracy and inference speed.

### 2.6.2 Open-World Detection: From "Unseen Classes" to "Learnable Unknowns"

**Open-World Detection** builds on open vocabulary by further requiring the model to explicitly handle "unknown classes": only some categories are annotated in the training data, while other objects are either unannotated or collectively labeled as background; during inference, these "unannotated real objects" should neither be simply treated as background nor incorrectly classified into known categories, but should be detected as "unknown class" with the potential to be subsequently converted into "new known classes."

In terms of modeling, open-world detection typically needs to solve three problems:

1. **Unknown class awareness**: How to avoid learning all unannotated targets as "background" during training? Common approaches include: introducing explicit "unknown class" slots, using negative example mining and uncertainty modeling to teach the model to output "unknown" in low-confidence regions; or using unannotated data and self-supervised mechanisms to cluster and generate pseudo-labels for high-confidence potential object regions.
2. **Misclassification control**: The model needs to balance "rather judge as unknown than incorrectly classify into a wrong known class," involving loss design (such as margin, open-set discrimination), decision thresholds, and post-processing strategies.
3. **Progressive category expansion**: When businesses annotate new categories for a batch of "unknown" targets, the model should be able to incorporate these new categories into the "known class" set through incremental learning without significantly forgetting old classes. To this end, many works introduce memory banks, distillation losses, parameter isolation, or replay mechanisms to achieve stable absorption of new categories.

From a product perspective, open-world detection is particularly suited for scenarios where **categories continuously grow and the long tail is extremely severe**, such as natural species recognition, rapidly updated product recognition, and anomalous object detection in complex security scenarios. The system can first use open-world detection to mark "any suspicious target that is not background," and gradually upgrade valuable clusters to formal categories through manual or semi-automatic annotation, forming a "sustainably growing category" detection system rather than being constrained by fixed datasets.

### 2.6.3 Open-Domain / Open-Distribution Detection: Robustness Across Styles, Devices, and Scenarios

Even if the category set remains unchanged, detectors still encounter severe **Domain Shift** in real-world deployment: training data may come from daytime HD cameras in a few cities, while the deployment environment includes different countries, rural areas, highways, tunnels, nighttime, rain and snow, low-resolution cameras, fisheye lenses, and even infrared imaging; e-commerce product photography and user-taken photos, advertising images/illustrations/anime styles also have huge differences. **Open-Domain Detection** focuses precisely on: maintaining stable and reliable detection performance when image distributions undergo significant changes.

Typical technical approaches include:

- **Domain Adaptation**: Given unlabeled or sparsely labeled target domain data, making the model learn domain-insensitive features through adversarial domain alignment (confusing source/target domains in feature space), multi-level domain alignment (image style, features, detection head output), and style transfer (such as transferring source domain image style to the target domain).
- **Domain Generalization**: Given only multi-source domain data without target domain data, using multi-domain training, style randomization, feature perturbation, meta-learning, and other methods to expose the model to as diverse distributions as possible during training, improving generalization to unknown new domains.
- **Universal / Foundation detection models**: Pretraining detection backbones and head structures on extremely large-scale, multi-source, multi-style data (including natural images, video frames, synthetic data, cross-modal data, etc.), then lightly fine-tuning on specific business scenarios to obtain stronger open-domain robustness than "single-domain training."

These open-domain mechanisms are often superimposed with open-vocabulary/open-world capabilities: a universal detection system facing the real world needs to understand users' natural language category descriptions (open vocabulary), give reasonable "unknown" judgments and progressive absorption for newly emerging targets (open world), and maintain performance across different countries, devices, weather, and styles (open domain). In engineering deployment, these three are not isolated research directions but together constitute the key capability combination for moving from "closed benchmarks" to "open-world usability."

## 2.7 Vision-Language Tasks

The preceding sections mainly revolved around "single-modality vision": the input is an image, and the output is detection boxes, segmentation masks, category labels, or quality scores. But in many real applications, visual information doesn't exist in isolation — an image is often accompanied by titles, descriptive text, dialogues, or search queries; users want to ask "what's happening in the image" or "does this image match this sentence." **Vision-language tasks** solve precisely these kinds of problems: they take image + text as input or output, through **cross-modal alignment and joint modeling**, enabling the system to "describe an image," "answer questions about an image," and "find images with text / find text with images."

From a product perspective, vision-language models (VLMs) are the central capability of multimodal systems: search engines rely on them for "text-to-image / image-to-text" search; content platforms use them for intelligent image pairing, ad review, and image-text consistency checks; multimodal assistants use them as a foundational capability for "chatting about images" and "asking questions about documents/screenshots." Below we examine this layer from three perspectives — **scenarios**, **principles**, and **models** — and expand on image captioning, visual Q&A, and image-text retrieval in subsequent subsections.

- **Scenarios**
  - Image Captioning: Automatically generating one or two sentences of natural language description for an image, used for accessibility-assisted reading, smart album descriptions, and search index enrichment.
  - Visual Question Answering (VQA): Users pose natural language questions about an image ("What is this person holding?" "What is the license plate number?"), and the system gives precise answers, applicable to education, assisted decision-making, and multimodal assistants.
  - Cross-modal Retrieval: Retrieving relevant images with text (Text-to-Image), or retrieving relevant text with images (Image-to-Text), supporting "text-to-image / image-to-text" search, creative image selection, and ad placement review.
  - Image-text consistency and moderation: Judging whether an image matches its title/ad copy, whether there are risks of "image-text mismatch" or "misleading descriptions," used for content moderation and brand safety.
- **Principles**
  The core question is: how to map images and text into **the same semantic space**, and perform alignment and reasoning within this space:
  - Cross-modal alignment: Through jointly trained image and text encoders, bringing corresponding "image-text pairs" close in representation space and pushing unrelated pairs apart (typically CLIP); this provides the foundation for retrieval and matching.
  - Joint understanding and generation: On top of aligned representations, introducing cross-modal attention to let language models generate text (image captioning), reason, and answer questions (VQA) while "looking at image features."
  - Prompt-based and instruction-based: Using natural language instructions to uniformly describe multiple vision-language tasks ("write a title for this image," "answer questions about this image," "judge whether this text describes the image"), allowing one model to complete multiple tasks through different prompts.
- **Models**
  Mainstream vision-language models have roughly evolved into two categories: **contrastive learning VLMs** and **generative multimodal foundation models**:
  - Contrastive learning: CLIP, ALIGN, etc., encoding images and text separately into vectors, trained on large-scale image-text pairs to excel at retrieval and matching tasks — the foundation for "text-to-image / image-to-text."
  - Vision-language generation models: BLIP / BLIP-2, Flamingo, Kosmos, LLaVA, etc., bridging vision encoders with large language models (LLMs) through cross-modal attention and instruction tuning, supporting complex tasks such as image captioning, VQA, and multi-turn dialogue.
  - Universal multimodal foundation models: Such as GPT-4.1 with Vision, Gemini 1.5, etc., further unifying vision with more modalities (speech, code, etc.) in one large model, completing retrieval, Q&A, reasoning, and generation through a unified interface.

Overall, vision-language tasks mark the point where "vision is no longer a separate perception channel" but participates together with language in higher-level knowledge representation and reasoning. Below, we expand from two directions: **image captioning and visual Q&A**, and **image-text retrieval and cross-modal alignment** (merged into two subsections by content).

### 2.7.1 Image Captioning and Visual Q&A: From "Describing Images" to "Reasoning About Images"

The goal of **Image Captioning** is to input an image and output a natural language description, such as "a little girl flying a kite on the grass." Traditional approaches typically adopted "CNN + RNN" structures: using convolutional networks to extract whole-image features, then LSTM/GRU to generate descriptions word by word; with the emergence of Transformers and pretrained VLMs, the mainstream paradigm has gradually shifted to "image encoder + text decoder" structures, such as BLIP / BLIP-2, ViT + GPT, etc. In training, models are typically autoregressively trained on large image-text pairs, sometimes with reinforcement learning or contrastive losses to optimize description diversity and correctness. At the product level, image captioning is widely used for accessibility reading (generating image descriptions for screen reader software for the blind), smart album auto-captioning, and providing more text indexing for search systems.

**Visual Question Answering (VQA) further introduces human interaction: the model's input is no longer "image + blank prompt" but "image + question," outputting a short answer or natural language explanation. Compared to image captioning, VQA emphasizes controllability and reasoning ability more**: questions can focus on local details ("What color is the man's hat?"), relationships ("Which car is closer to the intersection?"), counting ("How many dogs are there?"), and even require external knowledge ("What cuisine does this dish belong to?"). Early VQA models typically used image encoder + question encoder + fusion module (such as bilinear pooling, attention) + classification head, outputting answers from a limited vocabulary; modern multimodal foundation models directly use image encoder + LLM, generating natural language based on "looking at the image," with clear advantages in open-ended answers and multi-turn dialogue.

Both can be viewed as different "prompt templates" under a unified VLM framework:

- Captioning: `<image> + "Describe this image in one sentence."` → text;
- VQA: `<image> + "Q: ... A:"` → text.

Through instruction tuning, the same multimodal foundation model can accommodate description, Q&A, explanation, tagging, and other tasks, which is also the foundational engineering approach for modern VLM products (multimodal assistants, image Q&A bots, etc.).

### 2.7.2 Image-Text Retrieval and Cross-Modal Alignment: Text-to-Image & Image-to-Text Search

**Cross-modal Retrieval** addresses another high-frequency need: given a piece of text, find matching images (Text-to-Image Retrieval); or given an image, find related text descriptions, product information, news reports, etc. (Image-to-Text Retrieval). These capabilities form the core of products like "text-to-image / image-to-text search," "find products by image," and "match images to news."

The core technology is **cross-modal alignment**: models represented by CLIP use separate encoders for images and text (such as ViT and Transformer text encoder), trained on large-scale image-text paired data using contrastive learning:

- For matching (image, text) pairs, bring their vectors close in the embedding space;
- For mismatched image-text pairs, push their vectors apart.

After training, simply encoding all images and text into vectors enables fast matching through vector retrieval (nearest neighbor search) in the shared space:

- Text-to-Image: text → text vector → nearest image vector;
- Image-to-Text: image → image vector → nearest text vector.

In engineering practice, such models typically adopt a two-stage structure:

- First stage uses a lightweight, fast bi-encoder (such as CLIP) for coarse retrieval, quickly filtering a small set of candidates from a billion-scale image library;
- Second stage optionally uses a stronger cross-encoder or multimodal foundation model to refine and rerank candidates for improved relevance and robustness.

On the product side, image-text retrieval and cross-modal alignment are widely used for: image search, ad retrieval (finding suitable images based on ad copy), compliance review (checking ad image-text consistency), content recommendation (recommending related images/videos based on users' text reading history), etc. With the rise of multimodal foundation models, such retrieval capabilities are also being unified into larger multimodal frameworks, offering unified interfaces in the form of "natural language instructions + multimodal memory/vector stores."

## 2.8 Optical Character Recognition (OCR)

In many businesses, the most important information is neither reflected in "objects and scenes in the image" nor in natural language descriptions of the image, but is written directly on the image as **text**: contract terms, invoice amounts, road sign names, meter readings, error messages in screenshots. **Optical Character Recognition (OCR)** revolves around the structured understanding task of "image + document layout": automatically detecting and recognizing text content from complex visual input, understanding document layout and structure, and subsequently supporting search, statistics, automatic data entry, and intelligent Q&A.

From a product perspective, OCR is the key bridge for "turning paper/image information into computable text," and the infrastructure for digitization, automation, and intelligent office work: contract review, invoice processing, government archive digitization, PDF-to-Word conversion in office software, document Q&A assistants — all are built on OCR capabilities. Below we examine the OCR system from three perspectives — **scenarios**, **principles**, and **models** — and expand on core directions in subsequent subsections.

- **Scenarios**
  - Scene text recognition: Shop signs, road signs, billboards, packaging text in street views for navigation, search, retail insights, and compliance review.
  - Document OCR: Text recognition and structuring of scanned documents, faxes, PDFs, photographed contracts/invoices/reports, restoring them to editable text.
  - Specialized scenarios: License plate recognition, meter readings (electricity, water, gas meters), screenshot text extraction, exam paper/form recognition, etc.
  - Document understanding: Extracting titles, paragraphs, tables, footnotes, and other structures from layout-complex long documents, laying the foundation for search, summarization, and Q&A.
- **Principles**
  OCR systems are typically divided into several key steps:
  - Text detection: Detecting all text regions (text lines or text blocks) on the image, outputting bounding boxes (horizontal or four-point polygons) as input for subsequent recognition.
  - Text recognition: Performing sequence recognition on each detected text region, converting pixel sequences to character sequences (such as Chinese, English, numbers, symbols, etc.).
  - Layout Analysis: In document scenarios, identifying the roles of different regions (title, body text, images, tables, headers/footers, etc.), restoring reading order and hierarchical structure.
  - Table structure recognition: Performing row/column division, cell boundary parsing, and merged cell restoration on table regions to rebuild logical table structure.
  - Document Q&A (DocVQA): Building on OCR and layout understanding, enabling the model to answer cross-region, multi-step reasoning questions such as "What is the payment date in this contract?" and "What is the amount on this invoice?"
- **Models**
  Common engineering approaches combine "specialized OCR modules + document understanding models + multimodal foundation models":
  - Text detection and recognition:
    - Detection: EAST, DBNet/DBNet++, and other segmentation or edge learning-based methods, adept at handling curved text and complex backgrounds;
    - Recognition: CRNN, RARE, SAR, and other sequence models (CNN + RNN/Attention + CTC or autoregressive decoding), supporting multiple languages and fonts.
  - Document layout and structure understanding:
    - LayoutLM / LayoutLMv2/v3, DocFormer, etc., jointly encoding text content (tokens), positional information (bounding boxes), and visual features;
    - "End-to-end document understanding" models like Donut, going directly from image to structured output (such as JSON / Markdown), blurring traditional OCR boundaries.
  - Document Q&A and multimodal understanding:
    - Stacking task heads on top of layout models for DocVQA;
    - Or directly using multimodal foundation models (VLMs) to read document images, completing Q&A and summarization at the natural language level while implicitly leveraging OCR capabilities.

Overall, OCR has evolved from early "simple character recognition" into a comprehensive document understanding system encompassing **text + layout + structure + Q&A**, serving as a key pillar for enterprise digitization, government archive management, and intelligent office work. Below, we expand from three directions: **text detection and recognition**, **document layout and table structure analysis**, and **document Q&A and multimodal DocVQA**.

### 2.8.1 Text Detection and Recognition: From Pixels to Usable Text

The first step of OCR is **text detection**: finding all regions containing text in the input image. Street/scene text faces challenges such as diverse fonts, skew and distortion, complex lighting, and severe background interference; document scenarios emphasize robust support for dense text and multi-column layouts. Methods like EAST and DBNet transform the detection problem into "pixel-level segmentation + edge learning," predicting text probability and geometric parameters on feature maps, then obtaining precise text boxes (horizontal or arbitrary quadrilateral/polygon) through post-processing, balancing accuracy and speed.

**Text recognition** then crops each detected text region and converts it to a character sequence. The classic approach is represented by CRNN: first using CNN to extract features, then RNN or Transformer for sequence modeling, and finally CTC or attention decoding to output character sequences. For variable-length text, curved text, and complex languages (mixed Chinese-English, multilingual), recognition models need to simultaneously excel at visual feature modeling and character language modeling. Methods such as RARE and SAR introduce Spatial Transformer Networks (STN) or attention alignment mechanisms to correct geometric distortions and improve adaptability to complex layouts.

In engineering systems, detection and recognition typically serve as two decoupled services forming an OCR pipeline: front-end detection splits the image into text lines/blocks, back-end recognition performs character recognition on each block, with optional language model overlay for error correction (such as spelling fixes, number/amount validation). For specific scenarios like license plates and meter readings, specially fine-tuned detection/recognition models are used to leverage scene priors (fixed fonts, limited character sets) for higher accuracy and lower latency.

### 2.8.2 Document Layout and Table Structure Analysis: Restoring "The Shape of a Document"

Simply recognizing text is not enough, especially in long documents, reports, contracts, and invoices — **layout structure** often determines the meaning and importance of information: hierarchical relationships between titles and body text, positions of charts and captions, roles of headers and footers, logical order of text inside and outside tables. The goal of **Document Layout Analysis** is to identify the roles and boundaries of different regions on a 2D page and restore reasonable reading order and hierarchical structure.

Models like LayoutLM / LayoutLMv2/v3 and DocFormer jointly encode each text token's content (text embedding), spatial position (bounding box coordinates), and local visual features (from CNN/ViT), modeling semantic-spatial relationships between tokens through Transformer. By training on datasets with layout annotations, models learn to distinguish multiple region types such as "title/paragraph/list/table/figure caption/header/footer" and provide corresponding labels and hierarchy in the output. These models typically serve as "middle layers," providing structured document skeletons for contract review systems, report parsing, and archive digitization platforms.

**Table Structure Recognition** is a particularly critical branch of layout analysis: it needs to not only detect table regions but also further parse row/column boundaries, cell coordinates, and merged cells, ultimately rebuilding a logical table (typically represented as HTML, Markdown tables, or structured JSON with coordinates). Implementation methods include:

- Rule/vision-based: Using line detection, segmentation networks, object detection, and other means to extract table lines and cell regions, then building topological graphs;
- Transformer-based: Encoding text blocks and geometric information from table regions into sequences, directly predicting cell structures and relationships.

In products, these capabilities support high-value scenarios such as "PDF to Word/Excel," "receipt/invoice structured entry," "report parsing and metric extraction," serving as key components of government and enterprise office automation.

### 2.8.3 Document Q&A and DocVQA: From "Reading Documents" to "Asking Documents"

When OCR and layout analysis capabilities are strong enough, the next natural demand is: **instead of having people browse documents themselves, directly "ask the document."** This is **Document Q&A (DocVQA)**: the model answers questions on complex documents such as contracts, reports, invoices, and manuals, such as "When does this contract take effect?" "What is the net profit for Q4 2023 in this report?" "Who is the buyer name on this invoice?"

Traditional DocVQA systems are typically built as "OCR + layout model + QA head":

- First use OCR to extract text and coordinates;
- Use LayoutLM / DocFormer etc. to model text-layout-visual tri-modal relationships;
- Finally stack task heads (classification / extraction / span prediction) on this representation to locate answers or relevant fragments in the document based on the question.

With the development of multimodal foundation models, increasingly more systems directly use "document image + question" as input, having a VLM or multimodal LLM directly generate answers or explanations with citations. In this architecture, OCR, layout, semantic understanding, and reasoning capabilities work collaboratively inside the model in an end-to-end manner: the model can both see original layout and visual cues and leverage language world knowledge and reasoning patterns to answer complex questions.

In product form, DocVQA typically appears as "contract review assistants," "invoice/report Q&A," and "long document intelligent Q&A," helping users quickly locate key information from large volumes of documents, automatically generate summaries, perform clause comparisons, etc., significantly reducing the burden of manual review and information retrieval.

## 2.9 Image Generation and Editing (Image Generation & Editing)

The visual capabilities introduced so far are mostly "discriminative": input an image, output labels, boxes, masks, or text; while another main line that has rapidly developed in recent years is **generative vision**: models no longer just understand images but **create or modify images**, generating high-quality, multi-style visual content given text/image conditions. **Image generation and editing** is the core capability of this direction, supporting a wide range of products from AIGC drawing platforms to intelligent photo editing/effects tools.

From a business perspective, generative vision has evolved from "technical demonstration" into a genuinely usable productivity tool: designers use it for inspiration sketches and refined drafts; marketing teams use it to batch-generate posters and ad materials; regular users use it to create avatars, illustrations, and wallpapers; video creators use it for cutout, background replacement, and effects. Below we examine this layer from three perspectives — **scenarios**, **principles**, and **models** — and expand on text-to-image, image-to-image, and editing capabilities in subsequent subsections.

- **Scenarios**
  - Text-to-image: Users input a description ("cyberpunk night cityscape"), and the system automatically generates multiple matching images, supporting selection and iterative modification.
  - Style transfer and image translation: Converting real photos to anime/sketch/oil painting/watercolor styles, or mapping between different domains (day ↔ night, summer ↔ winter).
  - Conditional inpainting and outpainting: Repainting parts of the original image (Inpainting), extending beyond the frame (Outpainting) for fixing flaws, removing/adding objects, and expanding compositions.
  - Text-driven editing: Modifying images with natural language instructions ("change the sky to sunset," "make this car a red sports car"), without users needing to master complex image editing software.
- **Principles**
  Generative vision models primarily complete generation and editing by learning "image distributions" and "conditional control":
  - Distribution modeling: GANs, diffusion models, Flow Matching, etc. learn high-dimensional distributions from large numbers of images, enabling the model to progressively "sample" realistic images from random noise.
  - Conditional generation: Building on pure image distribution modeling, introducing conditions such as text/sketch/segmentation map/keypoints/depth map to constrain the generation process with external signals (Text-to-Image, Image-to-Image, ControlNet, etc.).
  - Controllable editing: In the latent space of existing images, guiding and modifying local features through text or local masks for local repainting, style changes, composition adjustments, etc.
- **Models**
  Current mainstream image generation and editing models are primarily based on **diffusion models + conditional control**:
  - GAN series: StyleGAN etc. excel in high-resolution faces and style control; but training is unstable and difficult to cover complex multimodal distributions.
  - Diffusion models: Stable Diffusion, Imagen, DALL·E series, etc., sampling through "forward noise addition + reverse denoising," combining quality and diversity — the current mainstay for Text-to-Image.
  - Controllable generation and editing: ControlNet, T2I-Adapter, etc., overlaying conditional channels (edges, pose, segmentation, etc.) on base diffusion models for precise control; combined with text-guided Inpainting/Outpainting for local editing and frame expansion.
  - Flow Matching and next-generation generative models: Learning continuous flow fields to transform noise distributions into image distributions, exploring new balances in efficiency, controllability, and stability.

At the product level, these technologies are presented to users in forms such as Jimeng, Alibaba Qwen image models, FLUX, OpenAI or Gemini nanobanana, Stable Diffusion ecosystem, Photoshop Generative Fill, Canva AI, CapCut intelligent cutout and effects, progressively evolving from "toys" into formal steps in the content production chain. Below, we expand from three directions: **text-to-image**, **image-to-image translation**, and **text-driven editing**.

### 2.9.1 Text-to-Image: From a Sentence to a Picture

The core task of **Text-to-Image** is: given a natural language description, generate an image that matches its semantics and style as closely as possible. Modern Text-to-Image models are primarily based on the diffusion architecture:

- First use a text encoder (such as CLIP Text Encoder or T5/LLM) to encode the input text into a conditioning vector;
- Then in the image latent space, starting from a high-noise state, performing multi-step reverse denoising sampling, using text conditioning to guide the generation direction at each step;
- Finally obtaining a high-resolution image matching the description, which can be further upscaled or post-processed.

Methods like Stable Diffusion, Imagen, and DALL·E series are trained on large-scale image-text pairs, enabling the model to master both the visual spectrum (shapes, textures, composition, lighting) and gain a degree of language-vision alignment ability (understanding complex descriptions like "style," "material," "composition"). At the product level, this capability enables "people who can't draw to create images": users only need to describe their ideas in natural language, and the system can provide multiple visual implementations, supporting iterative exploration and refinement.

Text-to-Image models typically also support multi-style, multi-resolution output: by adding style tokens, size conditions, etc. during training or inference, the same model can switch between "realistic photo style, flat illustration style, 3D render style," and other styles. Common engineering techniques include:

- Text prompt engineering, for refining and stabilizing output style;
- Lightweight fine-tuning techniques like LoRA / DreamBooth for quickly adapting general models to specific people, IPs, or brand styles.

### 2.9.2 Image-to-Image: Translation, Style Transfer, and Local Repainting

**Image-to-Image** tasks generate another "constrained" version of an image based on a given input image: preserving the original image's overall structure or content while achieving some transformation or enhancement. Typical forms include:

- Image translation / style transfer: Mapping between different visual domains, such as "photo → anime," "summer → winter," "day → night," "sketch → color image." Early approaches were mostly GAN-based (CycleGAN, Pix2Pix, etc.); now diffusion models with conditional control can also accomplish this.
- Conditional generation: Using sketches, segmentation maps, depth maps, edge maps, etc. as conditions, guiding the diffusion process through modules like ControlNet and T2I-Adapter, making the generated image strictly follow geometric/layout conditions while freely creating in texture, lighting, and style.
- Inpainting / Outpainting: Designating a region on the original image as the area to be repainted (inpainting), or extending beyond the frame to generate new content (outpainting), for "filling gaps" and "expanding images."

The key to these tasks is **creating new content while preserving constraints**. Diffusion models excel here: in inpainting, the model only samples within the masked region while keeping unmasked areas unchanged, using semantic understanding and contextual information to make new content blend naturally with surrounding areas in style and lighting. For style transfer, the model samples textures and colors from the target style distribution while preserving the input structure, achieving a "skin swap without bone change."

In products, Image-to-Image capabilities support a wide range of creative tools: style filters, cartoonization, one-click sky replacement, automatic beautification, old photo restoration, local retouching, etc., typically presented to users through highly visual interfaces.

### 2.9.3 Text-Driven Image Editing: Natural Language as the "Paintbrush"

In traditional image editing software, users need to master a whole set of professional concepts like layers, masks, selections, and filters; **text-driven image editing (Text-guided Editing)** attempts to replace most professional operations with natural language:

- "Replace the background with a nighttime city skyline";
- "Make this person wear a black suit";
- "Turn this car into a blue sports car, add motion blur."

Technically, text-driven editing is typically built on top of Text-to-Image diffusion models, implemented through several approaches:

- Searching or sampling in the latent space near the original image, keeping the edited image highly similar to the original, with changes only occurring in local areas affected by the text;
- Using explicit masks (user-selected regions) to limit editing scope to specific areas (this is the "select region then enter text instruction" feature in many tools);
- Introducing "instruction control" modules (such as ControlNet, learnable control tokens) to enhance the model's controllability and stability for editing requests.

Products like Jimeng, FLUX, Alibaba Qwen image models, Stable Diffusion ecosystem, and Canva AI all provide similar capabilities: users can complete complex editing through simple text and minimal interaction. For professional users, this becomes an "intelligent assistant" accelerating the creative process; for regular users, it dramatically lowers the barrier to image editing.

## 2.10 Image Quality Assessment (IQA)

In tasks such as low-level visual enhancement, compression encoding, image generation, and editing, we frequently need to answer a seemingly subjective question: **"Does this image look good?"** Manual inspection obviously can't scale, and traditional metrics like PSNR often don't align with human subjective perception. The goal of **Image Quality Assessment (IQA)** is to establish an automated mechanism for scoring or ranking image subjective/objective quality, serving as the key link connecting "low-level algorithm output" and "real user experience."

From a system perspective, IQA serves as the "gatekeeper" and "parameter tuning reference" in many pipelines: e-commerce/content platforms use it to filter blurry, noisy, or over-compressed uploads; phone cameras/albums use it to select "the best shot" from burst photos; cloud enhancement and compression services use it for before-and-after comparison evaluation to guide model iteration. Below we examine IQA from three dimensions — **scenarios**, **principles**, and **models** — and expand on assessment types and metrics/learning paradigms in subsequent subsections.
- **Scenarios**
  - Upload quality inspection and review: Scoring the quality of user-uploaded images/videos, filtering content that is severely blurry, abnormally exposed, visibly noisy, or heavily compressed with artifacts.
  - Intelligent photo selection and deduplication: In phone albums and camera apps, selecting the version with better clarity, expression, and composition from multiple similar photos, while identifying poor-quality or redundant images for cleanup.
  - Enhancement/compression algorithm evaluation: In A/B testing of algorithms for image enhancement, denoising, super-resolution, encoding/decoding, etc., using IQA metrics to objectively measure "which strategy is better," assisting parameter search and model selection.
  - Poster/thumbnail auto-selection: Automatically selecting frames with higher visual quality and appeal from video or multi-image collections as cover or poster candidates.
- **Principles**
  The core of IQA is characterizing image quality from two dimensions: **the degree of distortion relative to a reference image** and **the subjective quality perceived by the human eye**:
  - Full-Reference IQA (FR-IQA): Given a high-quality reference image, the image to be evaluated is compared pixel-by-pixel or in feature space against the reference to measure distortion, used for algorithm R&D and experimental evaluation.
  - No-Reference IQA (NR-IQA / Blind IQA): More common in real-world scenarios — without a reference image, quality can only be inferred from the statistical or deep features of a single image, requiring the model to learn from large amounts of images and subjective scores "what kind of images the human eye prefers."
  - Pseudo-reference / downsampled reference: In some scenarios, pre-compression low-resolution versions or model-predicted "ideal images" can be used as approximate references, balancing feasibility and evaluation accuracy.
- **Models**
  IQA models broadly fall into two categories: **traditional handcrafted feature metrics** and **deep learning-based quality prediction**:
  - Traditional metrics:
    - FR-IQA: PSNR, SSIM, MS-SSIM, FSIM, etc., focusing on structure, contrast, and phase information, sensitive to simple degradations (such as added noise, blur).
    - Perceptual metrics: LPIPS, DISTS, etc., measuring perceptual differences between images in deep feature space, with higher correlation to human subjective perception.
  - No-Reference / Learning-based IQA:
    - Early methods: BRISQUE, NIQE, BLIINDS series, etc., based on Natural Scene Statistics (NSS) and handcrafted features, training shallow models to predict quality scores.
    - Deep NR-IQA: RankIQA, DBCNN, HyperIQA, MUSIQ, etc., directly using CNN/ViT to extract features from images and training supervised on MOS (Mean Opinion Score) data to make output quality scores approximate human evaluation.
    - Pretrained representations: Leveraging features from large models like CLIP and ViT as input or backbone for quality prediction networks, fine-tuning on limited MOS data to improve generalization across complex distortion types.

Overall, IQA is not a single "higher is better" metric but rather an evaluation system tied to specific business objectives: in some scenarios (such as surveillance enhancement), preserving detail and recognizability is more important than visual naturalness; on content creation platforms, subjective perception and aesthetic standards take the lead. Therefore, a common industrial practice is to build "task-aware" quality evaluators by fine-tuning or learning weighted combinations on top of general IQA models with a small amount of business data.

### 2.10.1 Assessment Types: Full-Reference, No-Reference, and Pseudo-Reference

Based on whether a high-quality reference image exists, IQA can be divided into three categories: **Full-Reference (FR-IQA)**, **No-Reference (NR-IQA), and Pseudo-Reference**.

In **Full-Reference IQA**, we assume an ideal high-quality reference image exists, and the image to be evaluated is a degraded version after compression, transmission, or processing. The model quantifies the degree of distortion by performing pixel-level or feature-level comparisons between the two. PSNR is the simplest metric (based on mean squared error), while SSIM/MS-SSIM/FSIM further consider luminance, contrast, structure, or phase information, somewhat closer to human perception. These metrics are well-suited for evaluating encoding/decoding, super-resolution, and denoising methods during algorithm development, but their application in real business is limited due to the typical absence of reference images.

**No-Reference IQA (Blind IQA)** is the more common setting in real systems: only the image to be evaluated is available, with no reference. Early no-reference methods (such as BRISQUE, NIQE, BLIINDS, etc.) were primarily based on Natural Scene Statistics: assuming high-quality natural images have stable forms in certain statistical distributions, and distortions cause changes in statistical features, allowing models to be trained to predict quality scores from these features. In the deep learning era, NR-IQA models typically directly use CNN/ViT to extract features and regress quality scores or learn ranking relationships on datasets with human subjective scores (MOS), enabling coverage of multiple distortion types including noise, blur, compression artifacts, and exposure anomalies.

**Pseudo-Reference / Downsampled Reference IQA** falls between the two: without a truly high-quality reference, some obtainable approximate version (such as a pre-compression low-resolution image or a model-predicted "clean image") is used as a reference to estimate the degree of degradation. This approach is common in online video quality monitoring and encoding/decoding optimization tasks, balancing cost and accuracy.

### 2.10.2 Metrics and Learning Paradigms: From PSNR to Perceptual Quality Prediction

At the implementation level, IQA employs various metrics and learning paradigms to approximate human subjective perception.

**Traditional metrics**:

- PSNR is directly based on pixel-level errors — simple and efficient, but penalizes changes the human eye is insensitive to (such as slight shifts, structure-preserving filtering);
- SSIM, MS-SSIM, FSIM, etc. model image similarity across multiple dimensions including luminance, contrast, structure, and phase, being more sensitive to structural distortions and somewhat reflecting the human eye's preference for structural information.

**Perceptual metrics**: LPIPS, DISTS, etc. compute vector differences in the internal feature layers of pretrained deep networks (VGG, AlexNet, ViT, etc.), weighted by the importance of different layers, producing a "distance in feature space" with higher correlation to subjective perceptual similarity. They are especially suited as training objectives or evaluation metrics for generative tasks (super-resolution, generation, editing), measuring "how similar it looks."

**Learning-based quality prediction**: Deep NR-IQA models (such as RankIQA, DBCNN, HyperIQA, MUSIQ, etc.) directly score or rank images:

- In training data, each image comes with a set of subjective scores (MOS), which the model uses as supervision to train quality regression or ranking networks;
- Architecturally, most adopt CNN/ViT + global pooling + MLP to output quality scores, or output a quality distribution and take its expectation;
- Some methods also leverage contrastive learning or pairwise ranking, making the model focus more on "relatively better/worse" relationships rather than absolute scores.

With the proliferation of large-scale pretrained vision models, an increasing number of IQA methods adopt the "pretrained backbone + lightweight head" paradigm: leveraging rich visual representations from CLIP, ViT, etc., fine-tuning on limited MOS data to maintain good generalization across distortion types and scenarios.

In engineering deployment, multiple metrics are typically combined: for example, FR-IQA metrics for evaluating algorithm improvements during the experimental phase; deep NR-IQA models for real-time online quality inspection; perceptual metrics for internal optimization of generative tasks. Through A/B experiments aligning these automatic metrics with real user data (click-through rate, completion rate, complaint rate, etc.), a "perceptual quality measurement system" highly correlated with business objectives is progressively built.

# 3. 3D / Spatial Modality (3D / Spatial / XR)

As applications move from "flat images/video" to autonomous driving, robotics, AR/VR/XR, and other scenarios, systems can no longer be satisfied with merely seeing "2D pixels" — they need to understand **the three-dimensional structure, scale, and pose relationships of the real world**. These tasks are collectively called 3D / Spatial Modality: encompassing both precise modeling of geometry and topology, and semantic understanding, localization, navigation, and content generation in 3D space. On one end, it connects to LiDAR, RGB-D, IMU, and other sensors; on the other, it connects to autonomous driving perception modules, robot navigation systems, ARKit/ARCore environment models, phone 3D scanning apps, and digital twin platforms.

## 3.1 3D Perception & Reconstruction

In 2D vision, we only see "the world as photographed"; but in autonomous driving, robotics, AR/VR, and other scenarios, what matters more is: **the positions, shapes, and structures of the real world in 3D space**. 3D Perception and Reconstruction aims to recover the three-dimensional geometric information of the environment from multiple sensors (cameras, LiDAR, depth cameras, etc.) and express it in forms such as point clouds, voxels, meshes, and implicit fields, providing the foundation for path planning, physical simulation, digital twins, and 3D content generation.

In engineering practice, this layer encompasses multiple technical directions from **point cloud processing** to **multi-view geometric reconstruction** to **neural radiance fields / neural field rendering**, corresponding to product forms such as autonomous driving 3D perception modules, ARKit/ARCore environment modeling, phone 3D scanning/modeling apps, and digital twin city/campus modeling platforms. Below we examine this from three perspectives — **scenarios**, **principles**, and **models** — and further break it down into key sub-directions.

- **Scenarios**
  - Autonomous driving and driver assistance: Perceiving 3D structures of vehicles, pedestrians, road edges, lane markings, and traffic facilities from vehicle-mounted LiDAR point clouds and multi-camera images, for path planning and safety decisions.
  - Indoor/outdoor environment scanning: Using phones/tablets (structured light / ToF / stereo) or handheld scanners to collect multi-view data, building 3D models of rooms, buildings, and neighborhoods in real time for AR modeling, home design, and digital twins.
  - Digital twins and BIM: Reconstructing actual factories, campuses, and cities into high-precision 3D models through multi-view imagery and point clouds for operations management, simulation, and visualization.
  - Consumer-grade 3D scanning: Phone 3D scanning apps, one-click "photo to 3D model" tools, providing original geometry for 3D printing, virtual try-on, and game/film asset production.
- **Principles**
  - Point cloud processing: Treating sparse/dense point sets from LiDAR or multi-view reconstruction as 3D sampled point sets, performing filtering, registration, downsampling, and feature learning, then doing classification, semantic/instance segmentation, or 3D object detection.
  - Multi-view geometry and 3D reconstruction: Estimating camera poses and sparse 3D point clouds between multiple images through SfM (Structure-from-Motion), then generating dense point clouds via MVS (Multi-View Stereo), followed by mesh reconstruction and texture mapping.
  - Neural radiance fields / neural implicit fields: Using methods like NeRF, Instant-NGP, and Gaussian Splatting to represent 3D scenes as continuous volume density/color fields or Gaussian particle sets, generating images through volume rendering or rasterization, learning from multi-view supervision; after training, novel view rendering and geometry extraction are possible.
- **Models**
  - Point cloud networks: PointNet / PointNet++, PointCNN, DGCNN, MinkowskiNet, etc. directly learn features on points or sparse voxels for point cloud classification, segmentation, and 3D detection. Autonomous driving commonly uses 3D detection frameworks like VoxelNet, SECOND, CenterPoint, which convert point clouds to voxel or BEV (Bird's Eye View) features before detection.
  - Geometric reconstruction toolchains: COLMAP, OpenMVG / OpenMVS, and other traditional SfM/MVS systems can recover camera poses and dense point clouds from multi-view photos, building high-quality meshes.
  - Neural field reconstruction and rendering: NeRF / Instant-NGP, Gaussian Splatting, and numerous improved models encode scenes in neural networks or Gaussian clouds, achieving high-fidelity novel view synthesis and 3D scene reconstruction, progressively becoming engineered products. The industry has also seen 3D AI services like "Hunyuan 3D" and "Tripo" targeting developers and content production, packaging NeRF/Gaussian technologies as cloud APIs or interactive tools.

From this layer onward, traditional geometry and deep learning, implicit representations and explicit meshes are closely intertwined — needing to solve "how to accurately reconstruct the real world" while also balancing real-time performance and usability, serving upper-layer 3D scene understanding, 3D generation, and editing.

### 3.1.1 Point Cloud Processing and 3D Object Detection

For autonomous driving, robotics, and high-precision surveying, LiDAR point clouds are among the most critical 3D sensor information. A point cloud is a sparse set of points composed of 3D coordinates (sometimes with reflectance intensity, timestamps, etc.), lacking a regular grid structure, which poses challenges for traditional convolutions. The goal of point cloud processing is to extract useful geometric and semantic information from these unstructured points, such as "here is a car," "here is the road edge/ground," "here is a building."

In **point cloud classification and segmentation** tasks, we typically focus on: which category a point (or point cluster) belongs to — car, pedestrian, ground, road edge, building, vegetation, etc. — or performing semantic/instance segmentation on the scene. From a modeling perspective, approaches can be roughly divided into three categories:

1. Direct point cloud networks: PointNet / PointNet++, PointCNN, DGCNN, etc. define "permutation-invariant" operations directly on point sets, building hierarchical features through local neighborhood aggregation, suitable for classification and segmentation of small to medium-scale point clouds.
2. Voxel and sparse convolution: Rasterizing point clouds into 3D voxels, then using sparse 3D CNNs (such as VoxelNet, MinkowskiNet) for convolution, balancing structural regularity and spatial sparsity, widely applied in autonomous driving 3D detection.
3. Projection and multi-view: Projecting point clouds to BEV (Bird's Eye View), front-view depth maps, or multi-view images, then using 2D CNNs for feature extraction, relatively easy to combine with mature 2D detection networks.

In **3D object detection**, the goal is not simply labeling points but predicting 3D bounding boxes (position, size, orientation) and their categories — this is the core of autonomous driving environment perception. Typical methods like VoxelNet, SECOND, PointPillars, and CenterPoint typically convert point clouds to voxel or pillar representations, performing detection regression in BEV or 3D space. CenterPoint and similar methods use a "center point detection" paradigm, directly detecting object centers and their size/orientation on BEV, achieving both accuracy and speed. With the evolution of deep learning and sensor hardware, 3D detection can now achieve real-time inference on automotive-grade chips, becoming one of the foundational modules of the autonomous driving perception stack.

### 3.1.2 Multi-View Geometry and 3D Reconstruction: From Photos to Mesh

Without LiDAR, can we still "understand" 3D? The answer is yes — multi-view geometry and 3D reconstruction rely on "multiple photos + camera motion." By photographing the same scene from different viewpoints, we can use geometric constraints to recover camera poses and spatial structure — this is the classic SfM/MVS pipeline.

**SfM (Structure-from-Motion)** primarily solves two problems:

1. Estimating each image's camera extrinsics (position and orientation) from multiple pairwise or multi-view images;
2. Recovering a set of sparse 3D feature points in a unified coordinate system.

Typical tools like COLMAP and OpenMVG, through feature extraction and matching (SIFT/ORB, etc.), incremental or global BA (Bundle Adjustment), can automatically recover sparse point clouds and camera poses from uncalibrated image collections.
Building on this, **MVS (Multi-View Stereo)** leverages multi-view photometric consistency to generate dense point clouds: estimating depth for each pixel/viewing ray, progressively filling in the scene's geometric details.

After obtaining a dense point cloud, the next step is **Mesh Reconstruction**:

- Using Poisson Surface Reconstruction, Marching Cubes, or learning-based methods to "wrap" scattered point clouds into continuous surfaces, forming meshes with topological structure.
- Subsequently, hole filling, smoothing, boundary optimization, and Texture Mapping are typically performed to produce 3D models directly usable for rendering and editing.

In product form, this entire pipeline has been delivered through desktop software, cloud services, and SDKs. For example: phone 3D scanning apps invoke SfM/MVS-like processes in the background, automatically outputting a mesh model importable into game engines after users "take photos around" or "scan with video in a circle"; digital twin platforms run large-scale reconstruction at city/campus scale using aerial photography + street view data, generating interactive 3D scenes.

### 3.1.3 Neural Radiance Fields and Volume Rendering: NeRF, Gaussian, and Next-Gen 3D Reconstruction

Traditional SfM/MVS/mesh reconstruction can produce well-structured explicit geometry, but still has limitations in rendering quality, view continuity, and detail expression; Neural Radiance Fields (NeRF) and subsequent work have redefined 3D reconstruction and novel view synthesis through **implicit fields + volume rendering**.

In NeRF, the entire 3D scene is modeled as a continuous function:

$$
F_\theta(\mathbf{x}, \mathbf{d}) = (\sigma, \mathbf{c})
$$

Where $\mathbf{x}$ represents a point position in 3D space, $\mathbf{d}$ represents the viewing direction, $\sigma$ represents volume density, $\mathbf{c}$ represents color, and $\theta$ represents network parameters.

Given a point position x in 3D space and viewing direction d, the network outputs the corresponding volume density σ and color c for that point. By performing volume rendering integration along a camera viewing ray through this mapping function, we can obtain the pixel color for that camera pose; conversely, given only a set of multi-view photos and their camera parameters, we can solve for the model parameters θ by minimizing the error between rendered results and real images. After training, simply changing the camera pose allows synthesizing novel view images from perspectives "never actually photographed" (Novel View Synthesis).

Traditional NeRF has slow training and rendering speeds; subsequent work like **Instant-NGP** dramatically accelerated convergence and inference through multi-resolution hash grid encoding; **Gaussian Splatting** replaced the scene representation with 3D Gaussian particles, achieving high-quality, real-time novel view rendering through efficient rasterization. Meanwhile, extensive work has extended NeRF/Gaussian with editability, multimodality, and composability, gradually transitioning from research prototypes to engineering systems.

In terms of productization, NeRF/Gaussian technologies have been embedded in various 3D AI products:

- Phone/PC tools for "multi-view video → 3D scene" typically use neural fields or Gaussian particles for reconstruction and rendering;
- In game/film asset pipelines, neural fields are used for rapid scene capture and lighting restoration, then exported as Mesh + textures for traditional DCC tools;
- 3D AI services launched by major cloud vendors and content platforms, such as Tencent's "Hunyuan 3D" and Tripo, typically support "multi-view photos/short videos → editable 3D models/scenes," internally combining neural radiance fields, SDF/Gaussian representations, and subsequent explicit reconstruction, packaging high-quality 3D results as developer-friendly APIs or interactive products.

## 3.2 3D Scene Understanding & SLAM

If 3D perception and reconstruction answers "what does the world look like," then 3D scene understanding and localization further answers: "**Where am I in this world? Which areas are passable, and which are obstacles?**" For robot vacuums, AGV robots, drones, AR navigation, and indoor positioning systems, the ability to self-localize, build maps, and autonomously plan paths in 3D environments is a prerequisite for survival.

This work primarily revolves around **3D semantic understanding** and **SLAM (Simultaneous Localization and Mapping)**: the former performs semantic segmentation and passable area identification in reconstructed 3D scenes, while the latter uses visual/IMU/LiDAR sensors for camera/robot pose estimation and map building. In engineering, this layer is typically embedded as SDKs or algorithm modules in robot chassis, drone flight controllers, or mobile AR engines.

- **Scenarios**
  - Home and service robots: Robot vacuums and delivery/patrol robots build maps in indoor environments, identify room types and obstacles, and automatically plan cleaning or patrol paths.
  - Warehousing and logistics: AGV/AMR robots perform autonomous navigation in warehouses, identifying shelves, aisles, and restricted areas, completing transport and inventory tasks.
  - Drones and outdoor robots: Building 3D maps in outdoor environments, avoiding buildings, trees, power lines, and other obstacles, performing inspection, surveying, and security tasks.
  - AR navigation and indoor positioning: Phones/AR glasses obtain camera poses through SLAM and overlay navigation arrows, room information, and POIs on semantic maps for immersive guided navigation.
- **Principles**
  - 3D semantic segmentation and scene understanding: Performing semantic segmentation on point cloud or voxel representations, distinguishing walls, floors, tables/chairs, shelves, doors/windows, and other structures, while identifying passable areas and obstacles, providing semantic-layer information for navigation and behavioral decisions.
  - Pose estimation and SLAM: Through Visual SLAM (monocular/stereo/RGB-D) or LiDAR-SLAM, estimating 6D poses of cameras/robots from continuous sensor data, handling loop closure detection and map optimization, and when necessary, fusing IMU, wheel odometry, GNSS, and other multi-source information to improve robustness.
  - Map building and navigation: Overlaying geometric and semantic information on local/global maps to form 2D/3D/topological/semantic maps, and performing path planning, obstacle avoidance, and task assignment on this basis.
- **Models**
  - SLAM systems: Classic feature-point methods like ORB-SLAM series, direct methods like DSO, and IMU-fused VINS-Mono / VINS-Fusion achieve precise pose estimation and dense/semi-dense maps through front-end feature tracking + back-end optimization. LiDAR/visual-LiDAR fusion commonly uses frameworks like LIO-SAM.
  - 3D semantic segmentation networks: 3D CNNs like 3D U-Net and MinkowskiNet, and point cloud-based PointNet++ / KPConv / SparseConv series for semantic and instance segmentation of point clouds/voxels.
  - Multi-sensor fusion localization: Graph optimization or filter-based (EKF/UKF) methods fusing visual, IMU, LiDAR, odometry, and other multi-source information in a unified state space, improving localization stability in harsh lighting, texture-less, or dynamic environments.

Overall, 3D scene understanding and localization form the foundation for robots to "be able to move": both building a reliable self-localization framework in complex 3D worlds and making maps "meaningful" to support high-level task planning and human-robot interaction.

### 3.2.1 3D Semantic Segmentation and Passable Area Understanding

In purely geometric maps, all structures are just undifferentiated points/voxels; in real applications, what we care about is: where is the ground, where are walls, where are tables or shelves, where is it passable. **3D semantic segmentation** aims to assign a semantic label to every point or voxel, transforming "pure geometry" into "geometry + semantics."

In indoor/outdoor scenes, typical targets include:

- Fixed structures: walls, floors, ceilings, stairs, columns, roads, curbs, etc.;
- Furniture and facilities: tables, chairs, cabinets, shelves, doors, windows, handrails, etc.;
- Passable/impassable areas: robot walkable areas, obstacles to navigate around, restricted areas, etc.

Modeling approaches for 3D semantic segmentation commonly include:

- Voxel/sparse convolution: After voxelizing point clouds, using sparse CNNs like 3D U-Net and MinkowskiNet to learn voxel-level features, balancing local details and global structure.
- Direct point cloud: Point cloud networks like PointNet++ and KPConv perform feature aggregation on local neighborhoods for point-level semantic prediction.

In robot vacuum, AGV robot, and similar applications, semantic segmentation results are further abstracted into **semantic maps**: for example, dividing rooms into bedroom/living room/kitchen, or warehouse space into shelf areas/aisles/restricted zones. The robot not only knows "where it can go" but can also customize different strategies based on room type (e.g., avoiding carpet areas in bedrooms, prioritizing certain shelf areas in warehouses).

### 3.2.2 Pose Estimation, SLAM, and Multi-Sensor Fusion Localization

The goal of **SLAM (Simultaneous Localization and Mapping)** is: in an unknown environment, simultaneously estimating one's own trajectory while building an environment map. For indoor environments without high-precision external positioning (such as RTK-GNSS) support, SLAM is the go-to solution for most robots and AR engines.

In visual SLAM, methods represented by ORB-SLAM, DSO, and VINS-Mono/VINS-Fusion typically consist of several key modules:

- Front-end: Extracting and tracking keypoints/patches from consecutive images, estimating relative poses between adjacent frames.
- Back-end: Performing BA or graph optimization in sliding windows or global graphs, handling drift, loop closure detection, and relocalization.
- Map: Building dense or semi-dense maps from poses and depth information, providing the foundation for subsequent navigation or rendering.

Pure vision tends to fail when texture is lacking or lighting changes drastically, so in practice **multi-sensor fusion localization** is generally adopted:

- Visual + IMU: Frameworks like VINS-Mono/VINS-Fusion combine IMU's high-frequency short-term accuracy with visual scale and geometric constraints, significantly improving stability in short-term and sharp-turn scenarios.
- LiDAR + IMU + Visual: Odometry frameworks like LIO-SAM introduce inertial and optional visual information into LiDAR-SLAM, leveraging the complementary characteristics of all three for robust localization, widely used in autonomous driving and high-precision surveying.

At the product level, these methods are typically encapsulated as part of robot chassis controllers, drone flight controllers, AR engines (such as Visual-Inertial SLAM in ARKit/ARCore), or indoor positioning SDKs, shielding complex state estimation and graph optimization logic from upper-layer applications, allowing developers to directly obtain "real-time pose + map."

### 3.2.3 Semantic Maps, Navigation, and Obstacle Avoidance

With stable pose estimation and geometric/semantic maps, the next step is making robots "move intelligently." This primarily involves **semantic map building, path planning, and obstacle avoidance**.

- **Semantic map building**: Overlaying semantic information (room types, POIs, region labels) on geometric maps to form map representations suitable for high-level decision-making. For example:
- In home scenarios, dividing maps into bedroom, living room, kitchen, bathroom, and other areas;
- In warehouse scenarios, annotating shelf positions, loading areas, danger zones, etc.;
- In large malls/exhibition halls, annotating shops, service desks, restrooms, and other POIs for AR navigation and guided tours.
- **Path planning and obstacle avoidance**: Building grid graphs or topological graphs on maps, using planning algorithms like A*, D* Lite, RRT to find feasible paths from start to goal; simultaneously combining real-time perception (forward obstacles, dynamic pedestrians/vehicles) for local replanning and obstacle avoidance, ensuring operational safety and efficiency.
- **Navigation behavior and task scheduling**: In AGV robots and drones, task scheduling and multi-agent coordination modules are also layered on top of navigation: assigning tasks, avoiding congestion, optimizing overall paths and energy consumption.

AR navigation and indoor positioning systems fundamentally rely on similar semantic maps and path planning, except the "executor" changes from robot to human: the system obtains the user device's pose through SLAM, plans walking paths on the semantic map, then visualizes the path overlaid on the real-world view in augmented reality form.

## 3.3 3D Generation & Editing

If 3D perception and SLAM are about "collecting and understanding" geometry from the real world, then 3D generation and editing approach it from the content production angle: **how to use AI to automatically produce and modify 3D assets**. This directly addresses the enormous content demands of gaming, film/TV, digital humans, virtual spaces, e-commerce display, 3D printing, and more.

In the last two to three years, with breakthroughs in NeRF/Gaussian, SDF representations, multimodal diffusion models, and other technologies, 3D generation has entered a period of rapid development: generating 3D models or scenes from text, images, or video with one click has become reality, and major cloud vendors and startup teams have launched products like "Hunyuan 3D," Tripo, and DreamFusion/Magic3D series as online tools, making 3D production progressively evolve toward "accessible to everyone." 3D generation and editing can be roughly divided into four capability categories: text-to-3D, image/video-to-3D, model optimization and editing, and rigging and animation.

- **Scenarios**
  - Game/film asset production: Rapidly generating usable 3D models for characters, props, buildings, and scenes, significantly reducing art workload.
  - E-commerce and product display: Automatically generating 3D display models from product copy or photos for 3D viewing, AR try-placement, and interactive advertising.
  - Digital humans and virtual content: Rapidly generating 3D assets for virtual humans, virtual fitting models, virtual host scenes, supporting livestreaming, short videos, and interactive applications.
  - 3D printing and personalized modeling: Generating printable models from sketches/photos/text for personalized gifts, prototype design, and educational applications.
- **Principles**
  - Text-to-3D: Encoding text descriptions into semantic vectors, then generating 3D representations (NeRF/SDF/Gaussian/Mesh) through multi-stage optimization or diffusion processes, typically leveraging powerful 2D text-to-image models as "scorers" or priors.
  - Image/Video-to-3D: Using single or multiple images, multi-view video as supervision, combined with NeRF, SDF, or implicit/explicit hybrid representations, reconstructing 3D models with geometry and textures.
  - 3D model optimization and editing: Retopologizing, simplifying, enhancing details, generating LODs, UV unwrapping, and texture generation on existing models, as well as language/image-based deformation and stylization.
  - Rigging and animation: Automatically inferring skeletal structures for 3D characters and completing rigging, supporting skeletal animation and physical simulation (cloth, soft body, rigid body), producing drivable dynamic assets.
- **Models**
  - 3D generation base representations: NeRF / Instant-NGP, SDF (implicit surfaces), Gaussian Splatting, and Mesh-based generation networks constitute the expression space for 3D data.
  - Text-to-3D methods: DreamFusion, Magic3D, Fantasia3D, and other typical approaches complete end-to-end text-to-3D generation through "2D text-to-image model + 3D optimization" or "3D diffusion models," laying the technical foundation for subsequent products like Hunyuan 3D and Tripo.
  - Image/Video-to-3D models: NeRF/SDF/Gaussian-based reconstruction and optimization frameworks recovering stable 3D geometry and textures from multi-view consistency and single-view priors.
  - Rigging and animation algorithms: Automatic skeleton extraction, skeletal weight prediction, deep learning-based retargeting and motion generation, providing one-click tools for virtual human/character animation.

At this layer, traditional 3D DCC tools (Maya/Blender/3ds Max, etc.) and AI toolchains are gradually merging: many 3D AI services are embedded into existing production workflows as plugins or cloud interfaces, allowing modelers/artists to rapidly iterate assets through human-AI collaboration.

### 3.3.1 Text-to-3D and Scene Drafting

The goal of **Text-to-3D** is: given a natural language description, such as "a cartoon-style yellow duck toy with a blue scarf, suitable for children's toy display," the system automatically generates an editable 3D model (Mesh/NeRF/SDF/Gaussian, etc.). This is a typical application combining large language models/multimodal models with 3D representations.

Typical technical approaches include:

1. **Optimization based on 2D text-to-image models** (such as DreamFusion, Magic3D):
2. Using a powerful Text-to-Image model (such as a diffusion model) as an "evaluator," assessing how well images rendered from a 3D representation at a certain viewpoint match the text description.
3. Iteratively adjusting the 3D representation (NeRF/SDF/Mesh) through gradient optimization or diffusion processes so that images rendered from multiple viewpoints all conform to the text semantics.
4. **3D diffusion models / direct generation**:
5. Using 3D data (point clouds, voxels, implicit field parameters, Gaussian particles, etc.) as the generation target of diffusion models, pretraining on large-scale 3D datasets;
6. Achieving end-to-end Text-to-3D sampling through text-conditioned control.

At the scene level, **scene drafting** capabilities allow users to describe spatial layouts in natural language or rough sketches, such as "a living room with floor-to-ceiling windows, an L-shaped sofa on the left, a coffee table in the middle, bookshelves and a TV cabinet on the right," and the system automatically constructs a geometrically and semantically reasonable 3D layout draft. Subsequently, models and materials can be refined in DCC tools, or usable scene prototypes can be quickly produced through "scene generation" capabilities in tools like Hunyuan 3D and Tripo.

Currently, multiple platforms have launched Text-to-3D products for designers and developers:

- "Hunyuan 3D" and similar products integrate text-to-3D, multi-view generation, and reconstruction capabilities into a unified interface, supporting rapid generation of characters, props, and scenes from text, then exporting to game engines;
- Tripo-type products emphasize "multimodal input + one-click 3D output," supporting mixing simple text and reference images to guide generation of 3D assets meeting style and structural requirements.

### 3.3.2 Image/Video-to-3D and Model Optimization & Editing

Compared to pure text, generating 3D models from images or video provides stronger geometric constraints and better visual consistency. Therefore, many 3D AI products support **image-to-3D / video-to-3D**:

- Single photo → rough 3D: Using single-view priors (such as shape priors for faces, human bodies, common object categories) to infer approximate 3D geometry, generating 3D models usable for preview or simple interaction.
- Multiple photos / short video → high-quality 3D: Comprehensively using NeRF/SDF/Gaussian reconstruction, multi-view geometry, and post-processing to convert dozens of photos or a few seconds of video into high-fidelity 3D models, suitable for game/film assets or high-quality e-commerce display.

Generating 3D geometry is only the first step; substantial **model optimization and editing** work follows:

- Retopology and simplification: Converting implicit fields or high-polygon meshes into well-structured, controllable-face-count topology for rigging, animation, and real-time rendering.
- LOD generation: Automatically generating multi-level detail models (Level of Detail), using low-poly models at distance and high-poly models up close, balancing quality and performance.
- UV unwrapping and texture generation: Automatically unwrapping UVs for models, generating or optimizing normal maps, displacement maps, roughness/metalness maps, and other PBR materials; some models also support automatically generating stylized textures from text or reference images.
- Geometric and style editing: Making local modifications based on language or example images, such as "make this chair leg shorter" or "change this building to cyberpunk style," typically implemented through shape latent space manipulation or neural field editing.

Products like Hunyuan 3D and Tripo often integrate these workflows: starting from photos/video or simple text, the system internally completes reconstruction, retopology, texturing, and export, enabling non-professional users to obtain "plug-and-play" 3D models within minutes, dramatically shortening the time from concept to asset.

### 3.3.3 Rigging, Animation, and Dynamic 3D Assets

Static models are only half the content — "animate-able" 3D assets are more critical in gaming, film/TV, virtual humans, and interactive applications. This involves **skeletal rigging, weight painting, animation, and physical simulation**, traditionally high-barrier professional work now increasingly assisted or even semi-automated by AI tools.

- **Automatic Rigging**: Given a character mesh, the system automatically infers the skeletal hierarchy (spine, limbs, fingers, etc.) and bone positions within the model, and predicts each vertex's weights relative to each bone. Recent deep learning methods can learn this mapping on large-scale character datasets with skeletal annotations, achieving one-click skeletal rigging.
- **Animation and motion generation**: Overlaying motion data (Mocap or AI-generated) on existing skeletons to complete walking, running, expressions, gestures, and other animations; deep learning-based motion generation and retargeting can transfer human motions from video or other characters to new characters.
- **Physical simulation**: Simulating cloth, soft body, rigid body, and other physics to make hair, clothing, flags, and soft objects move more naturally. Some systems use neural networks to accelerate or approximate physics, making real-time engine physics more realistic.

In terms of products and ecosystems, these capabilities are commonly embedded in:

- Game/film asset toolchains: Providing modelers with one-click rigging, automatic weight distribution, and basic motion libraries, significantly reducing repetitive labor;
- Virtual human/digital asset production platforms: Starting from human photos or scans, through 3D reconstruction + automatic rigging + motion driving, outputting virtual humans drivable in livestreaming, short videos, and interactive applications;
- 3D AI platforms (such as Hunyuan 3D, Tripo, and similar products): After 3D generation, further adding rigging and simple animation capabilities so that "generated characters can move immediately" without complex DCC tool operations.

As 3D generation and editing technologies mature, the entire 3D content production workflow is evolving from "centered on professional DCC tools" to "AI-driven human-AI collaboration": AI handles generation and bulk foundational work, while humans focus more on style definition, quality control, and key design decision points. Next-generation 3D AI products like Hunyuan 3D and Tripo are concentrated manifestations of this trend, providing faster, more accessible 3D infrastructure for upper-layer gaming, film/TV, AR/VR, digital twin, and virtual human applications.

# 4. Audio (Audio / Speech)

In the overall technology stack, "audio" corresponds to the perception and generation of acoustic signals: encompassing both processing of raw waveforms and spectra, and converting speech to text, understanding "who is saying what," as well as further creating and synthesizing sounds and music. Similar to vision, audio can be decomposed into multiple layers: the bottom **waveform and spectral processing** handles "hearing clearly"; the middle **speech recognition and speaker technologies** handle "understanding who is saying what"; above that are more abstract **audio/music understanding** and **speech and music generation**. Together, these capabilities support products such as real-time meeting captions, voice assistants, podcast post-production audio editing, smart speakers, acoustic security monitoring, and music recommendation and generation.

## 4.1 Waveform-Level Audio Processing: Starting from "Hearing Clearly"

At the bottommost layer of audio technology, our primary concern is not "what is being said," "who is speaking," or "what style the music is" — but rather **whether the sound itself is clean and intelligible**. This layer works primarily at the waveform and spectral level, through operations like resampling, enhancement, denoising, and separation, processing noisy, distorted, or mixed raw sound into "clean signals" more suitable for subsequent recognition, analysis, and generation. It can be compared to "image enhancement + denoising + foreground/background separation" in vision — primarily performing acoustic-level cleanup without directly processing semantics.

From a product perspective, this layer is nearly "invisible" behind all audio products: real-time noise cancellation in meeting software, post-production audio editing for podcasts/short videos, "voice enhancement mode" in recording devices and phones, "beauty voice toggle" on livestreaming platforms, and front-end preprocessing for ASR/voiceprint models — all are direct manifestations of waveform-level audio processing. Below we examine this from three perspectives — **scenarios**, **principles**, and **models** — and expand on preprocessing & feature extraction, enhancement and denoising, and source separation in subsequent subsections.

- **Scenarios**
  - Online communication and meetings: Zoom, Tencent Meeting, etc. suppressing keyboard sounds, tapping, street noise, and echo in real time in noisy offices, open workspaces, and home environments, making speech clearer.
  - Content creation and post-production audio editing: In podcast, short video, and livestream post-production, automatically eliminating background noise, electrical hum, room reverb, repairing recording clipping and frequency band loss, improving overall listening experience.
  - Recording and transcription front-end: Recording devices, smart captions, and meeting transcription services performing VAD, denoising, loudness normalization, and other processing before entering ASR, improving back-end recognition robustness.
  - Terminals and IoT: "Far-field pickup" and "noise cancellation mode" on smart speakers, car systems, cameras, and other devices, trying to capture the primary speaker or key sound source in complex sound fields.
- **Principles**
  Waveform-level processing typically does not directly understand semantics but rather performs signal optimization around spectral structure and statistical characteristics:
  - Transforming back and forth between time and frequency domains (such as STFT → spectrogram/mel spectrogram → iSTFT), suppressing or modeling noise bands, reverberation features, or background sounds.
  - Distinguishing "speech-active segments" from "silence/noise segments" through VAD and energy/spectral features, reducing the impact of inactive segments on back-end processing.
  - Using deep learning or classical filtering methods to estimate masks or gain functions for "clean speech spectrum" and "noise spectrum," weighting the spectrum for enhancement and denoising.
  - In multi-source mixed scenarios, demixing different speakers, vocals and accompaniment, foreground and background environmental sounds into independent tracks through end-to-end separation networks or sparse representations.
- **Models**
  Waveform/spectral-level models can be roughly divided into two categories: **spectral-domain models** and **time-domain end-to-end models**:
  - Spectrogram/mel spectrogram U-Net series: Spectrogram-based U-Net, DCCRN, etc. performing "image-like" convolution and encode-decode on the time-frequency plane — a common approach for speech enhancement, singing voice separation, and other tasks.
  - Waveform end-to-end models: Wave-U-Net, Conv-TasNet, Demucs, etc. modeling directly on time-domain waveforms, avoiding explicit STFT/iSTFT, often achieving better subjective listening quality and time-domain fidelity.
  - Classical signal processing methods: Spectral subtraction, Wiener filtering, and other traditional frequency-domain methods still widely present in lightweight devices or ultra-latency-sensitive scenarios, often combined with deep enhancement networks to form "hybrid approaches."

### 4.1.1 Preprocessing and Feature Extraction: "Clearing the Stage" for Back-End Models

Any subsequent ASR, voiceprint recognition, event detection, TTS, or other model requires a maximally uniform, clean, and structured audio input — this is the responsibility of the preprocessing and feature extraction layer. It handles the most basic yet critically important "clearing" and "format unification," setting the stage for upstream audio models.

In the preprocessing stage, collected audio first undergoes **sample rate conversion and channel conversion**: for example, converting 48kHz stereo to 16kHz mono to meet downstream model input specifications and reduce computational cost. Subsequently, loudness normalization, DC component removal, simple filtering, etc. are performed to make audio recorded from different devices and scenarios more consistent in energy scale.

**Voice Activity Detection (VAD)** is another key component of preprocessing. It attempts to automatically delineate "speech-active segments" and "silence/pure-noise segments" in the audio stream, commonly based on frame energy, spectral entropy, zero-crossing rate, or small neural network discriminators. The benefits of VAD include: significantly reducing invalid data sent to ASR/voiceprint models, lowering computational load, while preventing silence segments from interfering with recognition (such as being misidentified as long strings of spaces or strange characters). In real-time communication, VAD can also drive "speech activity indicators" and auto-mute logic.

At the feature extraction level, the most common approach is converting time-domain waveforms to **spectrograms** or **mel spectrograms**. Through Short-Time Fourier Transform (STFT), audio is decomposed into time-varying frequency distributions; then through mel filter banks, mel spectrograms or mel cepstral features (such as log Mel-spectrogram, MFCC) more aligned with human ear perception can be obtained. These time-frequency features provide a "2D representation" for subsequent recognition, separation, and generation — similar to grayscale images or multi-channel feature maps in vision, convenient for convolution, attention, and other structures to process. With the development of end-to-end modeling, an increasing number of models learn features directly on waveforms (such as Wav2Vec 2.0), but in engineering practice, the STFT + mel feature combination remains the most common and reliable front-end.

### 4.1.2 Enhancement and Denoising: Restoring "Muddy Audio" to "Clean Audio"

In real environments, sound almost always propagates amid noise and reverberation: air conditioning hum, keyboard clicks, road noise, crowd clamor, room echo — all degrade speech and music intelligibility and subjective quality to varying degrees. The goal of **speech enhancement and denoising** is to suppress these background interferences while preserving speech naturalness and completeness as much as possible, restoring "muddled" sound to "clean" sound.

In traditional methods, this task was primarily achieved through frequency-domain techniques like spectral subtraction and Wiener filtering: first estimating the noise spectrum, then "subtracting" noise or adjusting band gains according to certain rules in the frequency domain. While simple to implement with good real-time performance, these methods tend to produce noticeable "musical noise" and artifacts in strong noise, non-stationary noise, and complex reverberation scenarios.

Deep learning methods work by learning a **mapping** on spectrograms or waveforms: given noisy speech, predicting a time-frequency mask or directly predicting the clean waveform. Common approaches include using **Spectrogram-based U-Net, DCCRN** and other encode-decode structures on mel/linear spectrograms for detailed spectral repair at each frame; or directly performing end-to-end waveform enhancement on time-domain waveforms using models like **Conv-TasNet, Demucs, Wave-U-Net**. These methods can significantly improve speech clarity and subjective listening quality in voice calls, online meetings, recording restoration, and other scenarios.

In content creation and post-production, "recording restoration" often also involves reducing plosives, reducing sibilance, compensating for frequency band loss, and equalization (EQ) and dynamic processing (compressors/limiters) — more "audio engineer-style" operations. An increasing number of tools combine these traditional processes with deep models, providing one-click "audio repair" and "audio beautification" capabilities for podcasts, video creators, and livestreaming platforms.

### 4.1.3 Source Separation: Unmixing the "Mix"

If enhancement and denoising are about "making the primary sound more prominent and the background quieter," then **source separation** goes further, attempting to completely split multiple mixed sound sources into independent tracks. For example: multiple speakers talking simultaneously in a meeting recording; vocals and accompaniment mixed together in music; primary events (such as alarms, shouts) buried in background noise in environmental recordings. The goal of source separation is to recover each independent source's waveform or spectrum from single or multiple mixed signals.

In the speech domain, **multi-speaker separation** is a core application: the model needs to separate overlapping speech into different channels based on voiceprint, time-frequency structure, and speaker features — without separate microphone tracks. This capability not only improves multi-speaker ASR performance but also provides cleaner input for speaker diarization. In the music domain, **vocal/accompaniment separation (singing voice separation)** can separate clear vocal tracks and pure accompaniment tracks from a mixed song, for covers, remixes, karaoke, music analysis, etc. Similarly, **environmental sound/foreground sound separation** can be used in security and IoT scenarios to extract key event sounds (such as glass breaking, conflict sounds) from complex backgrounds.

At the model level, source separation typically requires stronger modeling capabilities and more complex architectures than ordinary enhancement. End-to-end networks like **Conv-TasNet, Demucs, Wave-U-Net** can directly perform multi-source decomposition in the time domain; in the spectral domain, multi-branch U-Nets, attention, mask estimation, and other structures are common, predicting dedicated masks or spectra for different sources. With growing training data and computational resources, modern source separation models can output high-quality separated tracks usable for actual creation and analysis in quite complex reverberation and noise environments, providing a solid foundation for livestream beauty voice, multi-speaker meetings, music production, and audio retrieval.

## 4.2 ASR & Speaker Technologies

After completing preprocessing, enhancement, and separation at the waveform level, we can finally start asking higher-level questions: **"What is being said in the audio?" "Who is speaking?" "When and who is speaking?"** This layer focuses on various "understanding and labeling" tasks around speech itself: Automatic Speech Recognition (ASR), speaker recognition and verification, speaker diarization, and interaction-oriented hotword and keyword detection (KWS).

From a product perspective, this layer is the core of most "voice products": voice input methods, meeting transcription, customer service recording analysis, intelligent customer service quality inspection, smart speaker and car voice interaction, telephone robots, financial voiceprint verification — all directly rely on these technologies. They transform "clean sound" from the previous layer into text sequences, speaker labels, or keyword events, serving as one of the most important bridges from audio to the semantic world.

- **Scenarios**
  - Automatic Speech Recognition (ASR): Real-time captions, voice input methods, meeting and classroom recording, customer service call transcription, providing users with an instant "hearing-to-text" channel.
  - Speaker recognition and verification: "Voiceprint unlock" and "voiceprint verification" in phones/banks/call centers, and searching for specific speakers in massive recording archives.
  - Speaker diarization: In meetings, interviews, and panel discussions, automatically answering "who spoke when" for "per-speaker transcription."
  - Hotword and keyword detection (KWS): Wake word detection for smart speakers/car systems ("Hey Siri," "OK Google"), and capturing key phrases (such as "complaint," "refund," "escalation") in customer service recordings and quality inspections.
- **Principles**
  Most tasks at this layer can be unified as **time alignment and sequence labeling** on audio sequences:
  - ASR: Given a speech segment, learning the mapping from acoustic features to text sequences, commonly using CTC, RNN-Transducer (RNN-T), or attention-based end-to-end structures; modern models mostly adopt large-scale pretraining (such as Wav2Vec 2.0, Whisper, etc.) followed by fine-tuning.
  - Speaker recognition: Extracting a fixed-dimension **speaker embedding** (such as x-vector, ECAPA-TDNN) from audio; in this embedding space, speech from the same person clusters together and speech from different persons separates, combined with metric or classification models for recognition and verification.
  - Speaker diarization: Comprehensively using voiceprint embeddings, VAD, segment clustering, or end-to-end networks (EEND) to assign speaker labels to each time segment, constructing a "multi-speaker timeline."
  - KWS: Performing low-latency small-model detection on continuous audio streams, conducting local pattern matching and confidence evaluation for predefined wake words or keywords, balancing low computational cost and high recall.
- **Models**
  The model spectrum for ASR and speaker technologies includes both end-to-end architectures and specialized embedding models and clustering methods:
  - ASR: Wav2Vec 2.0, Conformer, Whisper, RNN-T, Citrinet, etc., mostly adopting convolution + self-attention or pure self-attention structures, supporting multilingual, large vocabulary, and long context.
  - Speaker embeddings: ECAPA-TDNN, x-vector, i-vector, etc., obtaining robust speaker feature spaces through classification training or metric learning on large speaker datasets.
  - Diarization: From the traditional VAD + segmentation + clustering pipeline to End-to-End Diarization (EEND) methods directly outputting "time × speaker" matrices.
  - Hotword/keyword detection: Lightweight CNN/RNN/Transformer front-ends combined with CTC or gating mechanisms, embedded locally on devices for always-on listening with ultra-low computational cost and low latency.

### 4.2.1 Automatic Speech Recognition (ASR): Turning "Sound" into "Text"

**ASR is the main pathway from "audio → text": whether voice input methods, meeting transcription, smart captions, or customer service recording analysis, the first step is accurately converting what users say into text. Modern ASR systems mostly adopt end-to-end architectures**: starting from acoustic features (such as mel spectrograms or direct waveforms), passing through a series of deep networks (such as Conformer, Citrinet, Transformer-based encoders), directly outputting text sequences or corresponding token sequences.

In terms of modeling, ASR's key challenges include long-term dependencies, multilingual and dialectal variation, accent changes, overlapping speech, background noise, and domain-specific terminology. To address these, current mainstream approaches use large-scale unlabeled audio for self-supervised pretraining (such as Wav2Vec 2.0, HuBERT), or large-scale supervised training on multilingual, multi-task data (such as Whisper), followed by fine-tuning with relatively small domain data to achieve good robustness across different languages, accents, and scenarios.

At the product level, ASR is typically packaged as "voice input method SDKs," "cloud speech recognition APIs," "meeting transcription services," and other capability outputs: the front-end can be real-time streaming recognition (RNN-T, streaming Transformer, etc.), while the back-end can enhance recognition of specific names, place names, brand names, and business terms through hotword injection, custom vocabularies, and context constraints. These recognition results often serve as the foundation for subsequent NLP, dialogue systems, and data analysis.

### 4.2.2 Speaker Recognition and Diarization: Answering "Who" and "When They're Speaking"

Compared to "what is being said," **"who is speaking" is equally important in many applications**: finance, government, customer service, security, and other scenarios need **voiceprint recognition** to verify identity or investigate risks; while meeting and interview scenarios need to know "who said each sentence" for per-speaker transcription, speaking time statistics, and behavioral analysis.

In **Speaker Recognition/Verification** tasks, the system's goal is: given a speech segment, determine who the speaker is, or whether it is the same person as a registered speaker. Modern systems typically extract a fixed-dimension speaker embedding vector from speech segments through models like ECAPA-TDNN and x-vector. During training, a combination of speaker classification and metric learning ensures embeddings from the same person cluster more tightly while embeddings from different persons are more distant; during inference, nearest neighbor or back-end discriminators (such as PLDA, cosine scoring with margin) are used for verification and recognition. This way, the system can answer "is it the same person" with a certain confidence over phone, microphone, and noisy environments.

**Speaker Diarization** further answers "who spoke when." Traditional approaches typically include three steps: first using VAD to find speech-active segments, then cutting long audio into short segments, extracting speaker embeddings for each segment, and finally performing clustering and time stitching in the embedding space to produce a multi-speaker timeline. More advanced **End-to-End Diarization (EEND)** methods attempt to directly output a "time × speaker" Boolean matrix from audio features, end-to-end learning complex patterns like overlapping speech and speaker switches. Diarization is extremely valuable in meetings, interview programs, court records, telephone customer service, and other scenarios, often combined with ASR to form "transcripts with speaker labels."

### 4.2.3 Hotword and Keyword Detection: The "Ears" for Interaction and Monitoring

In continuous audio streams, not every second is worth fully recognizing and storing. **Hotword and Keyword Detection (KWS)** serves as an always-on "goalkeeper":

- In smart speakers, car systems, and phone assistants, the KWS module detects wake words (such as "Hey Siri," "OK Google," "Xiao Ai"), and once detected, passes the audio stream to the more expensive ASR and dialogue system for processing.
- In intelligent customer service, quality inspection, and compliance scenarios, KWS flags and alerts on key phrases appearing in recordings or real-time calls (such as "complaint," "return," "rights protection," "fraud"), providing trigger points for back-end analysis and quality inspection strategies.

In technical implementation, KWS typically needs to operate under **extremely low computational cost and low latency** constraints, especially wake word detection on local devices: the model is often a small CNN/RNN/Transformer front-end with CTC or gated discrimination head, detecting acoustic patterns of specific words and using sliding windows and confidence smoothing to avoid false wakes. For keyword quality inspection scenarios, stronger ASR + keyword matching/regex + statistical analysis can be used, or end-to-end keyword tagging models can be directly trained. Regardless of form, KWS is essentially an "event-level" semantic filter on speech streams, serving as an important interface connecting the audio world and interaction logic.

## 4.3 Audio/Music Understanding (Audio Event & Music Understanding)

Not all audio centers on "speech." In reality, there are numerous scenarios related to environmental sounds, event sounds, and music, focusing more on: **"What sound event occurred?" "What is the current acoustic scene?" "What style is this song, what instruments are used, what's the rhythm and key?"** These capabilities are collectively called audio/music understanding, primarily revolving around sound event detection, environment/scene classification, and music attribute understanding.

From a product perspective, audio understanding technology supports applications including acoustic security monitoring, IoT acoustic sensors, smart device environment adaptation, music recommendation and classification, music copyright identification, music retrieval, and creation assistance. Similar to "image classification + fine-grained classification" in vision, this layer structurally transforms the continuous, complex sound space into discrete event labels, multi-dimensional attribute vectors, and style descriptions.

- **Scenarios**
  - Sound event detection: Detecting alarm sounds, glass breaking, baby crying, collision sounds, etc. for security monitoring, smart buildings, vehicle safety systems, and industrial alerts.
  - Environment/scene classification: Identifying "indoor/outdoor," "office/car interior/street/subway" and other acoustic scenes, providing the basis for smart device noise cancellation strategies, adaptive gain, and mode switching.
  - Music understanding and Music Information Retrieval (MIR): Genre classification, instrument identification, rhythm and key analysis, supporting music recommendation, playlist generation, music retrieval, copyright identification, and creative assistants.
- **Principles**
  Audio/music understanding is mostly based on **time-frequency features + deep neural networks** for classification or multi-label annotation:
  - Using features like log Mel-spectrogram to convert audio into "acoustic images," then using CNN, CRNN, or Transformer structures for time-frequency pattern recognition.
  - For sound event detection, multi-label and multi-temporal outputs are often used, predicting event presence along the time axis, sometimes combined with weakly supervised labels and multi-instance learning.
  - For environment/scene classification, more emphasis is placed on long-term statistical features and background patterns, often requiring modeling over longer windows.
  - Music understanding tasks combine music theory knowledge to model rhythm (BPM), beat positions, key, chords, and structure; some tasks use self-supervised or contrastive learning to pretrain music embeddings, then fine-tune for downstream tasks.
- **Models**
  Common audio understanding models are mostly pretrained on public datasets (such as AudioSet), then transferred to specific tasks:
  - CNN/CRNN models like VGGish, YAMNet, PANNs, etc., pretrained on large-scale audio data, usable for various audio event and acoustic scene tasks.
  - Transformer-based models like AST (Audio Spectrogram Transformer), directly using self-attention on spectrograms for stronger global time-frequency modeling capability.
  - Music-specific MusicTagging / MIR models pretrained on millions of songs for label models or embedding models, used for genre/mood/instrument labeling, music retrieval, and recommendation.

### 4.3.1 Sound Events and Acoustic Scenes: Enabling Devices to "Understand the Environment"

In security, IoT, smart city, and vehicle systems, cameras alone are insufficient to comprehensively understand environmental state. The goal of **sound event detection** is to enable systems to "understand" key events: when glass breaks, alarms sound, babies cry, collisions occur, screams erupt, fights break out, or vandalism happens, the system can identify these in audio signals and issue alerts. Unlike speech recognition, these events are typically short, non-linguistic, with varying frequency ranges and energy patterns, and may heavily overlap with background noise.

**Environment/scene classification** focuses more on continuous acoustic scenes: is it a quiet office, busy street, car interior, high-speed rail station, or café? The system can automatically adjust noise cancellation intensity, echo cancellation parameters, microphone array beam direction, and even change interaction strategies based on the acoustic scene (e.g., using briefer feedback interactions in cars, increasing output volume on noisy streets). In IoT scenarios, "acoustic networks" composed of multiple sound sensors can be used for long-term monitoring and statistical analysis of environmental states.

In technical implementation, both task types mostly adopt **multi-label classification + temporal modeling** approaches: converting audio to mel spectrograms, using VGGish, PANNs, AST, or similar models for feature extraction, then using temporal pooling or sequence models to output each label's activation along the time axis. Since many datasets only provide "clip-level labels" (weak labels), models often need multi-instance learning, self-attention pooling, and other methods to learn event temporal localization under weak supervision.

### 4.3.2 Music Understanding and Labeling: From "Playlist Tags" to "Structural Analysis"

In the music domain, the goal of audio understanding is not just "what song is this" but more importantly answering: **"What style is this song? What instruments are used? How fast or slow is the rhythm? What is the key and approximate harmonic structure?"** This information supports both music recommendation and playlist curation, and provides structured "music metadata" for creators and generative models.

**Genre classification** tasks categorize songs into pop, rock, classical, hip-hop, electronic, Lo-Fi, and other styles based on overall acoustic features and structure; **instrument identification** distinguishes the acoustic fingerprints of drums, bass, guitar, piano, strings, and other instruments in time-frequency features, usable for instrument statistics, music retrieval, and mix analysis. **Rhythm/key analysis** estimates BPM, beat positions, time signature, key, etc., providing the foundation for beat matching, automatic harmonization, DJ mixing, and game audio track synchronization.

In terms of models, music understanding mostly follows general audio models (such as PANNs, AST), but there are also many models and pretrained embeddings specifically for Music Information Retrieval (MIR). The typical approach is **multi-label music tag learning** (genre, mood, instrument, era, etc.) on large-scale music datasets to obtain a music embedding space, then fine-tuning or performing zero-shot inference on the specific tasks above. Combined with these models, music platforms can more intelligently complete music classification and recommendation, copyright platforms can strengthen music fingerprinting and similarity retrieval, and creation tools can leverage these understanding capabilities to recommend suitable accompaniment, extend similar styles, or automatically generate music structures.

## 4.4 Speech and Audio Generation (TTS / VC / Music Generation)

After completing "cleanup," "recognition," and "understanding" of audio, the next natural question is: **"Can we make machines directly 'speak,' 'sing,' or even 'compose'?"** This is the world of speech and audio generation: from text to speech (TTS), from one voice to another (VC / Voice Cloning), to broader music and sound effect generation, and singing voice synthesis that can sing lyrics and melodies. Similar to image generation, this layer no longer just labels or extracts structure from existing data but actively "creates" new sound content.

At the product level, these capabilities have permeated various applications: OpenAI TTS, ElevenLabs, Volcengine, MiniMax, and other voice product lines provide high-quality synthesized speech for applications; Suno, Udio, and other music generation platforms enable creators and even ordinary users to go from text to complete music; games, videos, virtual streamers, and digital humans rely on these models for voiceovers and singing, dramatically lowering content production barriers.

- **Scenarios**
  - Text-to-Speech (TTS): News broadcasting, navigation announcements, intelligent customer service voice replies, learning app content reading, accessibility screen reading, etc. — converting any text into natural, clear, controllable speech.
  - Voice Conversion / Voice Cloning (VC): Changing speaker timbre while preserving semantics and rhythm, achieving "voice swapping" or "few-shot voiceprint cloning" (under strict compliance conditions).
  - Music and sound effect generation: Generating suitable background music and sound effects (ambient sounds, UI sounds, transition sounds) for short videos, games, ads, podcasts, etc.
  - Singing voice synthesis and covers: Given melody and lyrics, having virtual singers perform, or generating cover versions in specific styles/timbres under compliance conditions.
- **Principles**
  Speech and audio generation typically adopt a **"high-level representation → low-level waveform"** hierarchical modeling approach:
  - In TTS, text is first converted to phoneme/syllable/character-level sequences, then through sequence-to-acoustic-feature models (such as mel spectrograms) (Tacotron, FastSpeech, VITS, etc.), and finally neural vocoders (WaveNet, WaveRNN, HiFi-GAN, etc.) generate high-fidelity waveforms from features.
  - In Voice Conversion, by decoupling "what is said (content)" from "who says it (timbre)," extracting content representation from source speech, then combining with target speaker embeddings or vocoder conditions to generate new speech waveforms.
  - Music and sound effect generation can be based on tokenized representations (such as notes, MIDI, encoded spectrum/codec tokens), using autoregressive, diffusion, or neural codec generative models to sample new audio from text, reference audio, or structural parameters.
  - Singing voice synthesis introduces more refined prosody, pitch contours, and singing control on top of TTS, typically with explicit or implicit modeling of pitch, duration, legato, vibrato, etc.
- **Models**
  Current mainstream technical routes for speech and audio generation include:
  - TTS: Tacotron / Tacotron2, FastSpeech series (non-autoregressive TTS), VITS, etc. handle text-to-mel-spectrogram or codec tokens; WaveNet, WaveRNN, HiFi-GAN, WaveGlow, etc. serve as vocoders or decoders handling feature-to-waveform. Recent Diffusion-based TTS and Neural Codec models further improve naturalness and diversity.
  - Voice Conversion / Cloning: VC frameworks based on speaker embedding + content encoder, and neural codec-based speech conversion models supporting few-shot voice cloning and cross-language speaker transfer. These technologies have been commercially deployed by many platforms, providing convenient voice cloning services. Domestic platforms include Volcengine, MiniMax, iFlytek Open Platform, Baidu Intelligent Cloud Qianfan, and Alibaba Cloud Intelligent Speech Interaction Platform; overseas, ElevenLabs, Resemble.ai, Play.ht, and other mainstream platforms. Among them, Volcengine's voice cloning supports quick training with a few audio samples, adapted for smart customer service, audiobooks, and other commercial scenarios; MiniMax leverages its large model technology advantages to achieve natural adaptation between cloned voice and text content, while supporting cross-language speaker timbre transfer; iFlytek's voice cloning has significant advantages in Chinese pronunciation clarity and emotional expressiveness, widely serving education, broadcasting, and other fields.
  - Music and sound effect generation: MusicLM, MusicGen, and models like Suno / Udio, typically based on text and/or reference audio conditions, using autoregressive or diffusion architectures on discrete codec tokens to generate long-duration audio.

### 4.4.1 Text-to-Speech (TTS): Making Machines "Speak Naturally"

**Text-to-Speech (TTS)** is the most intuitive speech generation task: input text, output natural and fluent speech that ideally is nearly indistinguishable from human voice. Modern TTS systems typically consist of two main stages: text to acoustic features (such as mel spectrograms), and acoustic features to waveform.

In the first stage, the model needs to handle tokenization, phonemization, polyphone disambiguation, punctuation and pauses, prosody prediction, and other issues. Typical models include attention-based Tacotron series and length-prediction-based FastSpeech series, the latter significantly accelerating synthesis and improving stability through non-autoregressive architecture. In recent years, end-to-end models like VITS have fused acoustic modeling and vocoders into a unified framework, further simplifying the system.

In the second stage, neural vocoders such as WaveNet, WaveRNN, HiFi-GAN, WaveGlow, etc. convert mel spectrograms or other intermediate representations into high-fidelity waveforms. Well-trained vocoders can not only generate natural and clear speech but also faithfully reproduce different timbres, emotions, and styles. Modern TTS systems also support **multi-speaker modeling** (through speaker embeddings), timbre/speed/emotion control (such as "excited," "calm," "broadcast tone"), and cross-language TTS, providing highly customizable voice capabilities for various applications.

### 4.4.2 Voice Conversion and Voiceprint Cloning: Changing "Who Is Speaking"

In many creative and assistive scenarios, we want to change the speaker's timbre or style **without altering content and rhythm** — this is the task of **Voice Conversion (VC)** and **Voice Cloning**. The former primarily addresses "converting A's words into B's voice"; the latter further emphasizes "learning a new timbre from just a few samples or even a few seconds of speech."

Technically, VC typically adopts a "content-timbre decoupling" approach: extracting content and prosody information through a content encoder (which can be ASR-based discrete units or self-supervised continuous representations), then using a conditional generator combined with target speaker embeddings or codec conditions to generate new speech with target timbre but essentially unchanged semantics and rhythm. Introducing neural codecs allows direct editing of speech in the codec space for high-fidelity conversion.

**Voice Cloning** builds on VC by emphasizing few-shot and generalization capabilities: the model needs to extract stable speaker representations from just a few samples or even a few seconds of audio and generate synthetically consistent speech with similar timbre. This capability is very useful for virtual personas, personalized assistants, game character customization, and voiceover acceleration, but also requires strict adherence to legal and ethical norms, ensuring use only under compliant authorization, informed consent, and safety controls to prevent misuse or identity impersonation risks.

### 4.4.3 Music and Sound Effect Generation: From Prompts to Complete Soundscapes

Compared to speech generation, **music and sound effect generation** is more complex in structure and time scale: music tends to last longer with richer internal structure (sections, melody, harmony, rhythm); sound effects are diverse in type, from natural environments (rain, wind, ocean waves) to onomatopoeia (UI clicks, notification sounds, game skill effects), each with their own patterns. In recent years, models based on neural codecs, sequence modeling, and diffusion have made "generating complete music/sound effects from text" a reality.

In music generation, models like MusicLM, MusicGen, Suno, and Udio typically encode audio into discrete codec token sequences, then train text-conditioned or multimodal-conditioned generative models on this discrete space. Users only need to provide a text description (such as "moderate tempo, warm and healing Lo-Fi background music, suitable for focused studying" or "tense electronic orchestral score, suitable for a sci-fi trailer") or upload a reference music clip, and the model can generate high-quality music lasting tens of seconds to several minutes. For creators, this is both an inspiration source and a powerful tool for rapid prototyping and background music generation.

For sound effect generation, similar technologies can generate UI sounds, notification tones, game ambient sounds, etc. based on text prompts, helping product and game teams rapidly iterate sound design. Combined with the previous layer's audio understanding capabilities, style alignment and scene adaptation are also possible, such as automatically matching sound effect styles based on visuals or game levels.

Whether speech, music, or sound effect generation, these capabilities are rapidly evolving: from early obviously synthetic machine sounds to high-fidelity content now indistinguishable from human voice and professional music. At the same time, issues surrounding copyright, compliance, provenance, and controllability have become especially important — how to provide powerful creative tools while protecting the legitimate rights and interests of creators and users will be an ongoing key issue for this technology layer.

# 5. Video

In the multimodal AI system, the **video modality** is responsible for understanding and generating "visual signals that change over time." Compared to single-frame images, video contains not only spatial texture, shape, and layout information but also rich **temporal cues**: the rise and fall of actions, object motion trajectories, camera cut rhythms, etc. Whether behavior recognition in security monitoring, motion analysis in sports training, one-click editing on short video platforms, or intelligent parsing of long videos — all fundamentally rely on a comprehensive set of understanding and generation capabilities built around "frame sequences."

From an engineering perspective, video capabilities can be broadly divided into several layers: **low-level video enhancement and restoration** ensures "visibility"; **video understanding and structural analysis** answers "what is happening"; building on this, **video + language multimodal tasks** transform video content into structured descriptions and retrieval interfaces usable as text; further, **video generation and editing** works in reverse from text or example videos to generate or reorganize video content in a controllable manner; and **digital human / avatar** applications integrate speech, language, motion, and video rendering into a new form for interaction and content production.

Below we similarly examine video-related capabilities from a layered perspective.

## 5.1 Traditional Video Processing: From "Playable" to "Good-Looking and Useful"

At the bottommost layer of video technology, our primary concern is not "who is in the frame" or "what event occurred" but whether the video itself is stable, clear, and comfortable: is it shaky, blurry, noisy, or in the right aspect ratio for target playback devices. **Traditional video processing** works primarily at the frame sequence and spatiotemporal pixel level, through enhancement, restoration, super-resolution, frame interpolation, and reframing operations, converting noisy, shaky, insufficient-resolution, or improperly proportioned raw video into "high-quality temporal signals" more suitable for viewing and subsequent analysis. It can be compared to "image restoration and enhancement + geometric correction" in the image modality, with the addition of temporal smoothing and consistency.

From a product perspective, these capabilities are nearly "invisible" behind all video products: one-click quality enhancement in editing software, automatic quality upgrades on short video platforms, smart super-resolution and frame interpolation in TV boxes and players, old film restoration services, and multi-frame preprocessing for upstream detection/recognition models — all are direct manifestations of traditional video processing. Below we examine this from three perspectives — **scenarios**, **principles**, and **models** — and expand on video enhancement and restoration, super-resolution, and frame interpolation in subsequent subsections.

- **Scenarios**
  In online video platforms, editing tools, surveillance systems, and terminal devices, traditional video processing primarily appears in the following typical scenarios:
  - Content platforms and editing tools: Short and long videos undergoing one-click quality enhancement, stabilization, anti-shake, and denoising during upload or editing, enabling users to "pick up their phone and shoot, and the result is immediately usable"; old video footage undergoing restoration and frame interpolation when imported into editing projects for visual consistency with new footage.
  - Film and old footage restoration: Digitally restoring historical film, early TV programs, and standard-definition footage, removing scratches, noise, and jitter, restoring color and detail, providing higher-quality versions for re-release, redistribution, and digital archival preservation.
  - Video surveillance and dashcams: Denoising, dehazing, enhancing contrast, and stabilizing low-light, rain/fog, or severely compressed surveillance footage, improving robustness of subsequent detection and recognition modules for evidence collection and traceability.
  - Terminal playback and device-side enhancement: TVs, set-top boxes, and phone players locally integrating super-resolution and frame interpolation, "upgrading" existing 720p/1080p, 24/30fps content to approximately 4K, 60/120fps visual effects during playback.
  - Multi-device adaptation and distribution: Adapting the same video for portrait phone screens, landscape tablet screens, and large TV screens through intelligent cropping and multi-ratio reframing, reducing manual editing and multi-version maintenance costs.
- **Principles**
  Traditional video processing typically does not directly understand semantic categories but rather models and optimizes at the spatiotemporal signal level around quality, stability, and temporal consistency:
  - Joint spatiotemporal modeling: Building on single-frame image enhancement, introducing temporal information through optical flow estimation, camera motion modeling, or spatiotemporal convolution, using preceding and following frames as additional "observations" for multi-frame fusion and noise suppression along the time axis.
  - Stabilization and anti-shake: Modeling camera shake as a sequence of geometric transformations over time (translation, rotation, scaling, etc.), estimating global or local motion trajectories, smoothing them, and reprojecting to output video for de-shake and stabilization effects.
  - Video super-resolution and frame interpolation: Video super-resolution improves spatial resolution through multi-frame alignment and detail reconstruction while maintaining temporal consistency; frame interpolation synthesizes intermediate frames between two frames through optical flow estimation or spatiotemporal generation networks, presenting motion at higher frame rates for improved smoothness.
  - Reframing and auto-composition: Detecting and tracking subjects (people, objects) in video, estimating subject trajectories along the time axis, then combined with target resolution aspect ratios, selecting appropriate crop windows for each frame and temporally smoothing crop window motion for natural viewing.
  - Quality-efficiency trade-offs: Cloud-based offline processing can pursue optimal quality and complex models, while phones, players, and real-time scenarios require controlling model parameters, computational complexity, and latency, making careful trade-offs in algorithm structure and inference frameworks.
- **Models**
  In specific implementation, traditional video processing comprehensively uses classical video signal processing methods and deep learning models, balancing effectiveness, efficiency, and deployment form:
  - Classical video processing methods: Optical flow-based stabilization and frame interpolation, temporal filtering and multi-frame fusion, block-matching-based denoising and de-compression artifact removal, still widely applied in compute-constrained or interpretability-required scenarios.
  - Deep video restoration and enhancement models: Multi-frame super-resolution and enhancement networks represented by EDVR, BasicVSR / BasicVSR++, Real-ESRGAN video version, etc., through alignment and spatiotemporal feature aggregation, significantly outperforming traditional methods in denoising, deblurring, detail recovery, and compression artifact removal.
  - Deep frame interpolation models: Frame interpolation networks like DAIN, RIFE, FILM, etc., generating intermediate frames through explicit or implicit optical flow estimation and intermediate feature fusion, more stable than traditional optical flow + resampling methods in complex motion and occlusion scenarios.
  - Transformer-based video restoration: Using spatiotemporal attention to uniformly handle spatial texture and temporal dependencies, with stronger modeling capability in complex camera motion and multi-object scenes, while controlling computation through sparse attention, sliding windows, and other mechanisms during inference.
  - Actual products and systems: CapCut's smart enhancement, Topaz Video Enhance and other commercial enhancement software, Bilibili and various short video platforms' quality enhancement pipelines, old film restoration SaaS services, etc. typically cascade multiple models and strategies, dynamically selecting the optimal processing path based on material type and terminal conditions.

Overall, this layer works "before semantics" to lay the physical and perceptual foundation for video: both helping users achieve more comfortable viewing experiences and providing cleaner, more stable input for upstream detection, recognition, and generation models. Below, we expand on **video enhancement and restoration** and **super-resolution and frame interpolation** sub-directions.

### 5.1.1 Video Enhancement and Restoration: Polishing from "Watchable" to "Good-Looking"

Under real shooting conditions, video is often not "clean": severe jitter from handheld devices, high noise and smearing in low light, block artifacts and color banding from network compression, fading and scratches from old recording devices — all significantly reduce video quality below ideal state. The goal of video enhancement and restoration is to maximally restore stable, clear, natural viewing without changing video semantic content, polishing "barely watchable" footage to "pleasant or even good-looking" quality.

In the temporal domain, enhancement and restoration first need to address stability. Through feature matching or optical flow estimation on consecutive frames, global camera motion and local object motion can be separated, then using smoothed camera trajectories to re-render output frames, suppressing rapid jitter and micro-shaking, preventing viewer dizziness. Building on this, frame-level denoising, deblurring, and artifact removal focus more on spatial-temporal joint modeling: multi-frame joint denoising uses redundant information from preceding and following frames for "multi-exposure fusion"-like processing along the time direction, effectively suppressing high ISO noise and compression noise while preserving detail textures; for slight motion blur, blur kernel estimation or end-to-end deep networks perform deconvolution-like sharpening on frame sequences, making both static backgrounds and moving subjects sharper.

For old films and low-quality footage, restoration also involves "reconstruction" at the color and structural levels. Film aging causes yellowing, decreased contrast, and noticeable local scratches and spots; early digital video commonly suffers from low resolution, severe compression, and edge aliasing. Modern restoration workflows often adopt multi-step coordination: first using detection and segmentation models to locate scratches, spots, and other local damage areas, then using spatiotemporal inpainting networks to "borrow and fill" from neighboring frames and spatial pixels; simultaneously performing color restoration and contrast reshaping to bring overall color tone closer to original shooting or specified style references. For severely compressed video, dedicated de-artifact networks targeting block effects and ringing artifacts are also introduced, improving edges and details without over-smoothing.

These enhancement and restoration capabilities are often "one-click" in products: users simply check "stabilization," "quality enhancement," or "old video restoration," and the system automatically selects appropriate model and parameter combinations in the background for multi-stage processing of the video frame sequence. For business, this layer both directly determines viewers' subjective quality evaluation and indirectly affects upstream analysis model performance: cleaner, more stable video input often means more reliable face/license plate recognition, more accurate behavior detection, and fewer false alarms.

### 5.1.2 Super-Resolution and Frame Interpolation: From "Able to See" to "Smoother"

With display devices continuously upgrading and users' requirements for detail and smoothness continuously increasing, a large amount of existing video content appears "inherently deficient" in resolution and frame rate: 1080p looks insufficiently sharp on 4K screens, and 24/30fps is prone to trailing or stuttering on large screens and in fast-motion scenes. Super-resolution and frame interpolation technologies address these two problems: the former "fills in details" in the spatial dimension, while the latter "fills in process" in the temporal dimension, together elevating "barely visible" video to "detail-rich, smoothly playing" viewing.

Video super-resolution adds a key dimension compared to single-frame image super-resolution: time. Simple per-frame upscaling easily causes adjacent frame detail inconsistency, resulting in flickering and texture jitter. Therefore, mainstream methods all use information from multiple preceding and following frames, aligning details from neighboring frames to the target frame through optical flow estimation or feature-level alignment, then performing detail reconstruction after alignment. Models like EDVR, BasicVSR / BasicVSR++, and Real-ESRGAN video version first align and aggregate multiple frames in feature space, then use deep networks to infer high-resolution details, avoiding the "blurriness" and "plastic feel" of simple interpolation. In this process, balancing "physical plausibility" and "perceptual attractiveness" is the core of loss design and training strategy: improving objective metrics (such as PSNR, SSIM) while ensuring natural subjective perception without over-sharpening and false details.

Frame interpolation focuses on "filling frames" along the time axis. Traditional methods rely on optical flow estimation, first predicting each pixel's motion between two frames, then interpolating to generate new frames at intermediate positions according to certain rules. However, in fast motion, multi-object occlusion, or texture-complex regions, optical flow is often inaccurate, prone to trailing, ghosting, or local deformation. Deep frame interpolation models like DAIN, RIFE, and FILM simultaneously learn optical flow, depth, or intermediate feature fusion strategies through end-to-end networks, directly outputting interpolated frames with significantly improved stability and visual quality in complex scenes. For sports events, action game recordings, and slow-motion creation, frame interpolation can smoothly upgrade 24/30fps original video to 60/120fps, preserving motion details while reducing stuttering and ghosting.

In engineering practice, super-resolution and frame interpolation are often combined: for existing low-resolution, low-frame-rate content, temporal frame interpolation is performed first, then spatial super-resolution, or both are integrated in a unified spatiotemporal network. In terms of deployment, cloud-based offline processing suits film restoration and platform-level "quality upgrade" services with extremely high quality requirements, while on-device real-time inference is more common in TV boxes, player apps, and game/sports cameras, requiring model compression and hardware acceleration for low latency. Regardless of presentation form, super-resolution and frame interpolation have become important infrastructure for "HD/UHD experiences," giving old content a "second life" on new devices.

## 5.2 Video Understanding and Structural Analysis (Video Understanding)

If traditional video processing mostly stays at the "quality and stability" level, then **video understanding and structural analysis** begins answering semantic questions like "what is happening in the video": who is doing what, where, for how long, whether there is anomalous behavior, etc. The goal here is structural decomposition of video along the time axis: recognizing actions and behaviors, detecting and tracking objects, segmenting foreground and background, dividing scenes and shots, and extracting high-level semantic signals for downstream decision-making, retrieval, and alerting.

From a product perspective, these capabilities have penetrated deeply into various smart security platforms, sports training analysis systems, smart dashcams, and industrial quality inspection video analysis systems: identifying fights, falls, loitering, and other anomalies in surveillance; analyzing motion standards and technical details in sports and fitness scenarios; tracking vehicle and personnel trajectories in traffic and industrial environments, monitoring whether production processes are normal. Below we examine these capabilities from three perspectives — **scenarios**, **principles**, and **models** — and focus on several representative directions in subsequent subsections.

- **Scenarios**
  - Security and public safety: In city surveillance, campuses, and buildings, identifying behaviors like fighting, falling, gathering, running, fence climbing; early alerting for anomalous patterns like loitering and late-night lingering.
  - Traffic and transportation: Detecting and tracking pedestrian, vehicle, and bicycle trajectories at intersections, tunnels, and highways; analyzing red light running, wrong-way driving, lane occupation, speeding, and other behaviors for traffic management and accident investigation.
  - Sports and athletic training: Analyzing key phases and posture quality of actions like basketball shooting, tennis serving, and yoga poses, providing technical analysis and correction suggestions for athletes and general users.
  - Industrial production and quality inspection: Monitoring whether production line operation steps are standard, detecting missing or incorrect assembly or anomalous actions, providing foundational data for safety production and yield improvement.
  - Content structuring and retrieval: Splitting long videos into shots, classifying scenes, and marking important segments, providing structured indices for subsequent retrieval, recommendation, and editing.
- **Principles**
  The key to video understanding and structural analysis is joint modeling of spatial targets and semantics along the time dimension:
  - Action recognition and behavior analysis: Based on 2D/3D convolution, temporal pooling, or Transformer, encoding entire video clips to identify action categories; advanced methods combine body keypoint sequences and skeleton topology for finer-grained motion quality and pattern analysis.
  - Object detection and tracking: Performing detection on each frame while introducing cross-frame association mechanisms (appearance features, motion trajectories, etc.), linking detections of the same target at different times into continuous trajectories for multi-object tracking results.
  - Video semantic segmentation and scene analysis: Performing semantic or instance segmentation at the pixel level for each frame, leveraging temporal continuity to smooth predictions; simultaneously detecting shot cuts and scene boundaries for structural decomposition of long videos.
  - High-level event and anomaly detection: Building on basic action and trajectory features, using temporal modeling and pattern recognition methods to detect rare events and anomalous patterns, often combined with unsupervised or weakly supervised learning to address annotation scarcity.
- **Models**
  In model selection, video understanding and structural analysis typically adopt "spatial features + temporal modeling" combined architectures:
  - Classic models based on 3D convolution and Two-Stream, such as I3D, performing end-to-end action recognition on short video clips through simultaneous spatial and temporal convolution.
  - SlowFast series models based on multi-path and multi-time-scale, capturing semantics through slow paths and motion details through fast paths, achieving better balance between computation and accuracy.
  - Transformer-based video models like TimeSformer and Video Swin Transformer, using spatiotemporal attention mechanisms to model long-range video, better capturing complex events and multi-subject interactions.
  - Tube-based detectors and spatiotemporal convolution / Transformer models, extending detection boxes temporally into "tubes," performing behavior detection and spatiotemporal segmentation on joint spatial-temporal features.
  - Multi-Object Tracking (MOT) methods like DeepSORT, combining frame-level detections with appearance embeddings and motion prediction for stable target identity association across video.

Overall, these capabilities further abstract video from "high-quality pixel streams" to "behavior and event streams," laying the structural foundation for upstream multimodal understanding, retrieval, and decision-making. Below, we expand from three directions: **action recognition and behavior analysis**, **object detection and tracking**, and **event and anomaly detection**.

### 5.2.1 Action Recognition and Behavior Analysis: From Frame Sequences to "Who Is Doing What"

Action recognition and behavior analysis focus on "what the subject is doing within a time window." In security scenarios, this means identifying behaviors like "walking, running, falling, fighting" from video; in sports and fitness, it corresponds to finer-grained actions like "is the basketball shot, tennis serve, or squat standard" or "is the yoga pose correct." Technically, early methods mainly relied on 2D convolution + optical flow or handcrafted features, stacking several frames for overall classification; modern methods more commonly adopt 3D convolution (I3D, various 3D ResNet variants), multi-time-scale structures like SlowFast, or spatiotemporal attention-based models like TimeSformer and Video Swin Transformer for joint modeling of spatial texture and temporal changes.

In many scenarios requiring high-precision posture analysis, directly classifying RGB clips is insufficient; body pose estimation and skeleton sequence modeling are also combined: first extracting 2D/3D keypoints from each frame, then feeding keypoint sequences into RNN, temporal convolution, or GCN/Transformer networks to analyze the temporal structure and spatial coordination of actions. This "pose prior + temporal modeling" approach is more robust to background, lighting, and clothing changes, suitable for applications with high demands on motion details such as yoga, fitness, and industrial operation standard assessment.

### 5.2.2 Object Detection and Tracking: From "Where in This Frame" to "Full Trajectory"

Single-frame object detection can tell us "what targets are in this frame and where they are," but many real-world tasks need "where this car/person came from, where they're going, and what they did in between." Object detection and tracking modules are designed to string frame-level detections into temporally continuous trajectories: on one hand running detectors on each frame to produce candidate target boxes; on the other hand, matching and associating boxes across adjacent frames based on appearance features (ReID embeddings), motion prediction (Kalman filtering), and spatial overlap cues to obtain Multi-Object Tracking (MOT) results.

In engineering practice, a typical pipeline is: "robust pedestrian/vehicle detection + association algorithm like DeepSORT," deployed on surveillance or dashcam systems, outputting each ID's motion trajectory in real time. In more complex systems, these trajectories are also combined with region semantics (lanes, zone divisions) and business logic rules to further infer high-level behavioral patterns like wrong-way driving, prolonged lingering, and frequent entry/exit, providing continuous temporal signals for upstream security, traffic flow analysis, and industrial process monitoring.

### 5.2.3 Event and Anomaly Detection: Finding "Something Off" in "Normal Patterns"

In most business scenarios, what truly needs attention are often "rare anomalies" and "critical events": such as fights, falls, and gatherings in security; anomalous shutdowns or rule violations in industrial production; dangerous driving behaviors in traffic. These events are relatively rare, with high annotation costs and extremely imbalanced samples, posing additional challenges for model construction.

A common approach is to build a temporal anomaly detection module on top of basic action recognition, object tracking, and scene segmentation: either directly learning from a small number of annotated anomaly samples through supervised methods; or using unsupervised/weakly supervised methods to model "normal pattern" motion and behavior distributions, issuing alerts when new observations significantly deviate from historical distributions. At the model level, temporal autoencoders, contrastive learning, graph neural networks, or temporal Transformers are combined to uniformly encode spatial relationships and temporal dependencies, capturing more complex group behavior patterns and long-range dependencies.

## 5.3 Video-Language Multimodal Tasks

If video understanding addresses "the video itself is well understood," then **video-language multimodal tasks** focus on "how to use natural language to describe, question, and retrieve video content," and "how to quickly locate key information around text needs on long video timelines." These tasks need to simultaneously process visual, speech, and text signals: on one hand extracting visual and audio features from video, on the other hand interfacing with language model reasoning and generation capabilities, compressing spatiotemporal content into text summaries, Q&A results, and semantic indices suitable for human consumption and machine invocation.

From a product perspective, these capabilities have penetrated deeply into long video automatic caption and timeline generation, short video editing platforms' "smart marking / key segment extraction," and enterprise training and meeting video Q&A assistants: users no longer need to "watch from start to finish" but can directly retrieve, question, and reorganize video content through natural language. Below we examine this from three perspectives — **scenarios**, **principles**, and **models**.

- **Scenarios**
  - Caption and summary generation: Automatically generating multilingual captions for courses, lectures, meetings, and long video content, and on this basis generating chapter-level summaries, highlight lists, and timelines.
  - Video Q&A and knowledge access: Building "video Q&A assistants" for educational videos, operation demos, and enterprise training content, supporting natural language questions like "how is this step done" or "where did this person put the phone at the end."
  - Video content retrieval and segment localization: Supporting precise "text → video segment" retrieval in large-scale video libraries, such as "find the part mentioning price" or "find the segment explaining a certain formula"; automatically marking highlight segments and key information within individual long videos.
  - Content production and editing assistance: Combining video content understanding with language generation to automatically produce titles, copy, storyboard scripts, assisting creators in rapid editing and footage recombination.
- **Principles**
  The core of video-language multimodal systems is aligning temporal visual features and text representations in a unified embedding space, and performing retrieval, generation, and reasoning on this basis:
  - Multimodal feature extraction and alignment: Extracting spatiotemporal features from video frames/clips (CNN/ViT/Video Transformer) and language embeddings from text (pretrained LLM or text encoder), aligning the two modalities through contrastive learning or multimodal pretraining.
  - Speech and text pipeline: For content containing speech, typically first using ASR to generate timestamp-aligned transcriptions, then jointly modeling with visual features, enabling both text-driven retrieval and cross-modal comparison and error correction.
  - Temporal modeling and segment localization: For long videos, learning "segment-level" representations on the time axis, dynamically switching between local segments and global context through attention or temporal RAG for precise localization of question-relevant intervals.
  - Generation and reasoning: Connecting large language models to aligned multimodal representations for natural language generation (captions, summaries, explanations) or multi-turn Q&A and logical reasoning.
- **Models**
  In model form, video-language multimodal tasks have evolved from "specialized encoders + simple heads" to "unified multimodal large models":
  - Early video-language models: Such as VideoBERT, jointly modeling visual and text tokens during pretraining, obtaining transferable video-language representations through masked prediction and contrastive learning.
  - All-in-One Video-Language Models: Unifying video, text (and speech) into a single multimodal Transformer, through shared or partially shared parameters, achieving unified handling of caption generation, retrieval, QA, and other tasks.
  - Long video multimodal models: Such as Gemini, Claude, GPT with video capabilities, understanding tens of minutes to hours of video holistically through long context and hierarchical temporal modeling, supporting timeline-level summarization and Q&A.
  - Temporal RAG + VLM: Building "temporal vector indices" on video, first encoding video segments with VLM to create a database, then retrieving relevant segments during queries, combined with LLM for answer synthesis and interpretable reasoning.

Overall, this layer elevates video from "machine understanding" to "human-machine dialogue and collaboration": users can question videos as if asking a person, while the system performs complex visual, speech, and language alignment and reasoning behind the scenes.

### 5.3.1 Captions, Summaries, and Timelines: Compressing Long Video into Browsable Text

For courses, lectures, meetings, and long-form video content, the most pressing need is often "quickly knowing what was covered and where the highlights are" rather than watching from start to finish. Automatic caption and summary systems use a "ASR + text processing + visual assistance" combination to transcribe audio content into timestamp-aligned text, then generate structured outlines and concise summaries on this basis, achieving information compression from "hour-level video" to "minute-level reading."

At the implementation level, the ASR module is responsible for stably producing high-quality multilingual transcription and timeline alignment; on the text side, large language models are used for error correction, sentence segmentation, and semantic restructuring of raw transcriptions, extracting chapter titles, key information, and question-answer pairs. In some scenarios, visual cues (such as PPT page changes, scene transitions) are also combined to assist in dividing chapter boundaries and highlight segments, ensuring summary structure aligns more closely with the actual content rhythm.

### 5.3.2 Video Q&A and Semantic Retrieval: "Manipulating" Video with Natural Language

Beyond captions and summaries, a further need is the ability to question and retrieve specific video content: for example, "where did this person put the phone at the end," "which segment discussed pricing strategy," or "what minute demonstrates this step." These tasks require semantic localization of questions on the timeline: understanding both the people, objects, and actions involved in the question itself and finding the corresponding segment in the video's temporal representation.

In practice, multi-granularity indices are typically built offline for videos: extracting multimodal representations (visuals + text/speech) from fixed-length segments, building vector indices or graph structures. During online interaction, user questions are encoded as text vectors and matched against segment representations in the index to find the most relevant time intervals; subsequently, the content of these segments (keyframe screenshot descriptions, transcription text, etc.) along with the question are fed to an LLM, which generates natural language answers or returns the corresponding time points. For large-scale video libraries, the same mechanism can support "cross-video retrieval," such as searching for relevant segments across collections in enterprise training knowledge bases or e-commerce product videos.

### 5.3.3 Multimodal Editing Assistance: From Understanding to "Helping You Edit"

When systems can stably understand video content and semantic structure, the natural next step is to inversely leverage these understanding results to assist creation and editing. Video-language multimodal models can automatically select semantically matching segments from existing footage based on creator-provided scripts or prompts, generating rough cut timelines; they can also automatically generate titles, cover copy, chapter labels based on video content, and even suggest shot rhythm and background music.

In workflows, these capabilities typically appear as "smart recommendations" and "automatic rough cuts": after creators upload footage, the system automatically completes analysis, storyboard breakdown, marking, and presents several candidate versions (such as different rhythms or durations of edit proposals); creators can fine-tune on this basis without starting from scratch with frame-by-frame screening. For enterprise applications, systems can also combine knowledge bases and brand standards to ensure generated copy, captions, and editing styles meet established business requirements and compliance standards.

## 5.4 Video Generation & Editing

After achieving stable understanding and structural analysis capabilities, **video generation and editing** steps into the phase of "actively creating content": no longer just improving quality or performing structural analysis, but generating entirely new shots from text scripts, reference images, or existing video, or performing structural editing and reorganization on original video. This includes both text-to-video from scratch and style transfer, extension, and rearrangement based on existing images/videos, as well as fine-grained object-level editing and replacement.

In products, these capabilities have entered the content creation mainstream through products like Jimeng Video, MiniMax Video, Sora, Runway Gen-2, Pika, and Kling: advertising spots, concept films, animations, and storyboard scenes can be rapidly generated without relying on large production crews and complex post-production; creators can drive shots and styles through natural language scripts; traditional video editing workflows are beginning to deeply merge with structured generation tools. Below we examine this from three perspectives — **scenarios**, **principles**, and **models**.

- **Scenarios**
  - Copy/script to short video: Brand advertisements, mini-dramas, story clips, and concept animations — automatically or semi-automatically generating playable video drafts from scripts.
  - Image/video to video: Generating animated versions of illustrations or character designs, performing style transfer on real footage (real → anime/illustration), or extending/reorganizing existing video temporally and spatially.
  - Structured editing and post-production: Performing face swapping, lip sync, object removal and replacement, text-driven editing rearrangement, and other fine operations without changing overall content semantics.
- **Principles**
  Current mainstream video generation and editing methods mostly center on diffusion models or their variants, progressively "denoising" to generate video in high-dimensional spatiotemporal latent space:
  - Text-conditioned modeling: Mapping scripts to condition vectors through text encoders (such as T5/CLIP text towers or dedicated language models), guiding video decoders to align with text descriptions in style, content, and motion patterns.
  - Spatiotemporal consistency and motion control: Adding spatiotemporal convolution, temporal attention, or 4D representations (NeRF/GS, etc.) in the diffusion process or posterior optimization to ensure coherence and physical plausibility along the time axis.
  - Image/video-conditioned generation: Starting the diffusion process in the feature space of input images or videos, controlling noise injection, masked regions, and condition channels for "preserving given parts + generating new content" controlled editing or extension.
  - Structured control signals: Combining structural information such as pose skeletons, segmentation masks, depth maps, and camera trajectories to make generated video more controllable in subject motion and viewpoint changes.
- **Models**
  Representative models and directions include:
  - Diffusion-based Text-to-Video models (Sora, Runway Gen-2, Pika, Kling, etc.), pretrained on large-scale video-text pairs with strong generation capability in complex scenes, multi-shot motion, and diverse styles.
  - Image-to-Video diffusion models: Conditioned on single-frame images, predicting subsequent frame dynamic evolution for "single image → animation/motion effect"; or continuing, extending, and rotating viewpoints of short videos.
  - NeRF / 4D representations and keyframe + interpolation methods: Using 3D scene representations or keyframe + temporal interpolation to combine generation with geometry and consistency modeling for more stable viewpoint roaming and complex motion.

These capabilities do not exist in isolation but are progressively penetrating editing and post-production pipelines: from copy to storyboard, storyboard to rough cut, rough cut to stylization and local editing — an increasing number of stages are driven by "text + structured control."

### 5.4.1 Text-to-Video: From Scripts to "Watchable" Shot Sequences

Text-to-Video aims to achieve: users describe a scene, shot, or story segment in natural language, and the system automatically generates a coherent video clip. Compared to image generation, text-to-video adds the challenge of the temporal dimension: not only maintaining frame-level quality and style consistency but also ensuring cross-frame subject identity, lighting, background, and motion trajectory continuity.

Typical diffusion-based text-to-video models are first pretrained on large-scale video-text paired data: text encoders extract semantic conditions, and video decoders iteratively denoise a "noise video" in latent space, gradually converging to a spatiotemporal signal consistent with the text. Throughout this process, temporal attention, 3D convolution, or 4D representations explicitly build temporal dependencies into the network to avoid problems like "inter-frame jumps" and "character resets." Some systems also support controlling camera motion (pan, tilt, zoom, dolly) and compositional rhythm, making generation results closer to real shooting language.

### 5.4.2 Image/Video-to-Video: "Growing" and "Transforming" on Existing Content

Another important route is generation and editing based on existing images or video: for example, making an illustration or concept design "come alive," stylizing real-person video to anime, or changing backgrounds, adjusting weather and time while preserving structure. Technically, these methods add "reference channels" to the diffusion process: encoding input images or video as features, using them as conditions or initial states to participate in denoising, while controlling "which regions can be changed and which must be preserved" through masking, explicit geometric constraints, and other mechanisms.

For style transfer scenarios, models repaint textures and lighting to match the target style while preserving original motion and composition; for video extension and reorganization, "continuing" new frames at temporal endpoints or intermediates achieves horizontal/vertical scene expansion, viewpoint orbiting, or narrative supplementation. These capabilities are well-suited for combination with traditional editing workflows: editors first provide key shots and rhythm, then models automatically generate transitions and variants between these "anchor points."

### 5.4.3 Structured Video Editing: Object-Level Fine Control

In many business scenarios, completely regenerating video is not the primary need — what matters more is fine-grained, controllable structured editing of existing footage: such as face swapping, lip sync modification, removing unwanted objects, replacing billboard content, or rearranging shot order based on text scripts. Structured video editing develops along this direction: building on video understanding, introducing object-level segmentation, tracking, and parametric representations so that editing operations can stably bind to specific targets and time periods.

Face swapping and lip sync are the most typical applications in this direction: models need to map target identity onto the original video's performance while ensuring natural head pose and overall expression continuity, and precisely control lip motion based on new speech signals. Object removal/replacement relies on high-quality segmentation and spatiotemporal inpainting: first segmenting and removing target objects in each frame, then filling gaps using neighboring frames and contextual textures to avoid obvious "patched" appearances. Text-driven editing aligns "script structure" with the video timeline, automatically selecting and splicing segments matching script semantics for higher-level automated editing.

## 5.5 Digital Human / Avatar

**Digital Human / Avatar** can be seen as a "system-level integration" of video generation, speech synthesis, multimodal understanding, and graphics rendering: it doesn't just generate a video but continuously and controllably drives a virtual character to "speak, make expressions, and gesture" based on text or speech input, achieving near-real-time or even real-time interaction in an increasing number of scenarios. Compared to general video generation, digital humans emphasize three things more: **long-term consistency of identity and appearance, fine alignment of speech-expression-motion, and end-to-end system real-time performance and stability**.

From a product perspective, digital humans have widely appeared in **content production platforms, virtual customer service / smart reception / virtual guided tours, education training and online classrooms, brand virtual IP / virtual idols, and virtual streamer / digital twin tools for creators**: enterprises can mass-produce video content with fixed appearances and styles, government and enterprise services can use virtual reception for 24/7 user service, and individual creators can continuously produce "someone on camera" videos without ever showing their face. Below we examine this from three perspectives — **scenarios**, **principles**, and **models** — and expand on driving and expression, appearance and video generation, and real-time interaction and system integration in subsequent subsections.

- **Scenarios**
  - Content production and online distribution: Corporate promotional videos, product feature explanations, course recording, news broadcasting — using digital humans to replace real people on camera, significantly reducing shooting venue, lighting, and labor costs.
  - Virtual customer service and guided tours: Deploying digital humans at bank branches, government service halls, scenic areas, and museums for welcoming, inquiry, business consultation, and wayfinding, combining unified image with 24/7 service.
  - Brand virtual IP / virtual idols: Long-term operation of short videos, livestreaming, and e-commerce content around a virtual character, maintaining consistent persona and visual style across platforms.
  - Virtual streamers and digital twins: Providing configurable virtual streamers / digital twins for creators who don't want to appear on camera or need multi-identity operations, bound to real or synthesized voices, achieving "just speak / type to stably appear on camera."
- **Principles**
  A digital human system is essentially a "speech/text driving + appearance modeling + video/rendering output" multimodal pipeline, with slight differences between offline and real-time scenarios but similar core components:
  - Speech and language driving: Synthesizing speech from scripts directly using TTS, or connecting ASR + LLM to generate reply text from user speech/text, then outputting speech with TTS; speech features (such as mel spectrograms) serve as driving signals controlling lip and expression timelines.
  - Appearance and motion space modeling: Building controllable geometric and appearance representations for virtual characters, such as 2D portraits/illustrations, skeleton and Blendshape-based 3D Avatars, or NeRF/4D Gaussian-based renderable volumetric representations; and defining a set of "driving parameters" (such as keypoints, pose skeletons, Blendshape coefficients) to encode expressions and poses.
  - Speech → expression/motion mapping: Through specialized "speech-driven" models, mapping speech features to face and upper-body driving parameters for lip sync, expression details, and head-shoulder motion; real-time digital humans require this mapping to be end-to-end low-latency and stable.
  - Rendering and compositing: Rendering the virtual character in 2D or 3D based on current frame driving parameters, outputting continuous video streams or real-time frames; overlaying backgrounds, props, captions, and other elements, integrated with traditional video editing workflows.
- **Models**
  In specific models, digital human systems typically comprehensively use multiple types of specialized models and general multimodal models:
  - Audio-driven Talking Head models: Lip sync models like Wav2Lip, learning alignment relationships between speech and oral region pixels/geometry, generating natural lip motion while preserving identity consistency.
  - Real-time / lightweight digital human models: Such as Ultralight-Digital-Human and lightweight Talking Head models, significantly compressing parameters and computation in structure to enable near-real-time driving and rendering on CPU/mobile/WebGPU.
  - NeRF / 4D representation models: Such as ER-NeRF (Explicit / Efficient / Editable digital human NeRF approaches), modeling character appearance and expression changes in 3D space for more natural and coherent viewpoint, lighting, and motion, suitable for high-fidelity and multi-camera scenarios.
  - Speech-driven and multimodal alignment models: Such as MuseTalk-type "speech → facial expression / talking head" models, aligning audio and visual features to achieve realistic speaking expressions and head motion without relying on extensive 3D annotations.
  - Speech and dialogue models: High-naturalness multi-speaker TTS, end-to-end speech dialogue models (ASR + LLM + TTS integrated), providing digital humans with multi-style, multilingual voice and dialogue capabilities.

Overall, digital humans are both a set of models and a complete system: they integrate language understanding, speech, visual generation, and real-time inference to present an interactive virtual character "in front of the screen." Below, we expand from three directions: **driving and expression**, **appearance and video generation**, and **real-time interaction and system integration**.

### 5.5.1 Driving and Expression: From Scripts/Speech to "Talking, Expressive" People

In the digital human pipeline, **driving and expression** addresses a core question: given a script or speech, what lip shape, expression, and head-shoulder motion should the virtual character present in each frame. This includes both offline batch production scenarios and real-time dialogue responses.

In offline content production, the common chain is "text script → TTS → speech driving": the business side provides broadcast copy, the TTS module generates speech in the target timbre (such as a brand virtual spokesperson), then speech features are input to the "speech → motion" model. **Wav2Lip-type models** are important representatives at this stage:

- They take reference portrait frames and corresponding speech segments as input, predicting lip regions precisely aligned with speech through a convolution/attention network, then blending with the original portrait to precisely modify lip shape while preserving identity and most expressions.
- During training, speech-video alignment data supervises the network to learn oral cavity shapes corresponding to different phonemes, maintaining temporal continuity to avoid lip jumps or delay.

Compared to early pure lip sync approaches, next-generation speech-driven models (such as MuseTalk-type methods) have further expanded to **full-face expressions and head pose**:

- These models typically map speech features to a low-dimensional "emotion/expression latent space," then generate keypoints, Blendshape coefficients, or directly generate image features through a decoder, driving subtle changes in eyebrows, eyes, cheeks, and other regions for more vivid "speaking expressions."
- Some models also encode semantic information from speech content (such as questions, emphasis, exclamations), combined with syntactic/pragmatic signals analyzed by LLM, adding nods, frowns, gestures, and other motions at intonation changes to improve naturalness and expressiveness.

At a higher dimension, **driving and expression** can also combine external control signals: for example, using pose skeletons, gesture trajectories, gaze direction, etc. as additional inputs, enabling digital humans to mimic specific speakers' styles or execute predefined motion templates based on "indicated actions" in scripts (such as "point at the screen" or "open both hands"). Whether Wav2Lip's local lip driving or MuseTalk / real-time skeleton driving's fuller expression modeling, they collectively achieve continuous mapping from speech/text to face and upper-body motion — the key link making digital humans "look like they're genuinely speaking."

### 5.5.2 Appearance and Video Generation: From "A Model" to "A Shapeable Character"

The driving pipeline solves "how to move," while **appearance and video generation** determines "who moves, where they move, and in what style they move." This includes both high-fidelity realistic digital humans and stylized characters like anime, cartoon, and low-poly Avatars, as well as different technology choices for real-time and offline rendering.

In 2D portrait and illustration scenarios, the typical approach is training a **Talking Head generation model** based on a few reference images and short videos:

- The model encodes the person's identity information as an "appearance vector" or style feature, using driving parameters (such as speech latent vectors, keypoints, expression encodings) as condition inputs, synthesizing new frames in image space.
- Unlike pure Wav2Lip which only changes lip shape, these models can make small postural sways and overlay emotional expression changes, making the digital human look less "stiff."

In scenarios pursuing higher realism, freer viewpoints, and multi-camera switching, an increasing number of approaches adopt **NeRF / 4D representation** digital human modeling (such as ER-NeRF-type methods):

- Through multi-view photography or video, first reconstructing 3D volumes or Gaussian fields of the character's head/upper body, encoding states corresponding to different expressions and lip shapes as interpolatable latent spaces;
- During driving, mapping speech/expression parameters to this latent space, performing volumetric or Gaussian rendering in 3D, then projecting to screen.
- This approach's advantages include: more natural viewpoints, lighting, and backgrounds, supporting "surround viewpoints" and "virtual camera" motion, particularly friendly for VR/AR, virtual livestream rooms, and high-end advertising production.

In business scenarios emphasizing cross-device deployment and real-time performance, lightweight approaches like **Ultralight-Digital-Human** are also adopted:

- Through structural pruning, operator refactoring, and model distillation, compressing Talking Head or Avatar rendering networks to a scale that can run on mobile/WebGPU;
- Completing driving parameter to frame image generation in milliseconds, aligned with real-time speech streams or control signals for "low-latency digital humans," suitable for interactive terminals, kiosks, and web frontend applications.

At the complete video production level, appearance and video generation must also combine with backgrounds, props, and camera language: a common workflow is:

- First customizing a digital human appearance (2D or 3D) for a brand or individual;
- Presetting several virtual scenes (studio, office, classroom, exhibition hall, etc.);
- During content production, the system automatically selects appropriate scenes and camera positions based on scripts, generates digital human footage, and performs multi-screen composition with PPTs, demo videos, and product footage.
  This makes the digital human not just a "talking head" but a "character" that can naturally integrate into various program and content formats.

### 5.5.3 Real-Time Digital Humans and System Integration: From Offline Video to "The Colleague on Screen"

With the maturation of ASR, TTS, LLM, and lightweight video generation models, an increasing number of digital human systems are transitioning from **offline batch video production** to **real-time interaction**: users speak or input text on a terminal, and the digital human on screen "listens — thinks — responds — speaks" within hundreds of milliseconds to seconds, creating an experience similar to a real human customer service agent / guide / host. The key here is not just the models themselves but also how to compress the multimodal pipeline to **acceptable end-to-end latency**.

In a typical real-time digital human closed loop:

- **Front-end input**: The ASR module converts user speech to text in real time, or directly receives user text input.
- **Semantic understanding and decision-making**: The LLM generates reply text combined with business knowledge bases and tools (RAG, database queries, process orchestration), along with necessary structured instructions (such as which PPT page to display, which video clip to play).
- **Speech and driving**: TTS converts reply text to speech in the target timbre, and the speech stream is simultaneously consumed by Wav2Lip / MuseTalk / real-time skeleton driving models as it's generated, outputting corresponding lip and expression parameters segment by segment.
- **Rendering output**: Ultralight-Digital-Human-type lightweight rendering networks or GPU-based NeRF/Avatar rendering engines convert driving parameters to video frames in real time, outputting directly to screen through WebRTC, RTMP, or local rendering.

To provide consistent experiences across multiple terminals, the system also needs to make careful trade-offs between **latency, bandwidth, and compute**:

- In cloud rendering approaches, the majority of computation (LLM, TTS, driving, and rendering) is done on servers, with terminals only responsible for playing the video stream — suitable for compute-limited Web/App and offline large screens, but dependent on network stability;
- In "cloud + device hybrid" approaches, ASR and some LLM inference are done in the cloud while lightweight driving and rendering happen locally, significantly reducing audio-visual interaction latency — suitable for mobile devices and kiosks;
- On high-compute terminals (such as high-performance PCs and dedicated workstations), most of the pipeline can be deployed locally for stable interaction even in weak network conditions.

On the model side, **real-time digital humans** also impose additional requirements on structural design:

- Speech-driven models need streaming inference capability, providing lip and expression predictions after receiving just a small segment of speech rather than waiting for the entire sentence to finish;
- Rendering networks need to minimize reliance on large convolution kernels and global attention, using local convolutions, lightweight self-attention, resolution pyramids, and other structures to control computation;
- For NeRF/4D-based high-fidelity approaches, mesh caching, frustum culling, sparse volumes, and GPU optimization are needed to keep per-frame rendering within milliseconds to tens of milliseconds.

At the system integration level, real-time digital humans often need to be tightly bound to **business knowledge, persona settings, and dialogue strategies**:

- Managing industry knowledge, business processes, and FAQs through knowledge bases and RAG, ensuring "saying the right and complete things";
- Controlling speaking style and expression boundaries through persona configuration and script templates, ensuring "sounding like this person (or this brand)";
- Through multi-turn dialogue strategies and session state management, enabling the digital human to remember user context, confirm and follow up at appropriate times, presenting the interaction feel of "a real colleague / guide / instructor."

Overall, with the addition of models specifically designed for lip sync, expression driving, and real-time rendering — such as Wav2Lip, MuseTalk, ER-NeRF, and Ultralight-Digital-Human — digital humans are accelerating from "offline video template tools" to **real-time responsive virtual entities with stable personas and professional knowledge**, becoming the most comprehensive and application-rich link in the video technology system.
# 6. Time Series & Intelligent Agents (Time Series / Agents)

When AI moves beyond "text, image, audio, video" into the real world, two capabilities become especially critical: one is the ability to **understand and predict data that evolves over time** (time series), and the other is the ability to **autonomously plan and execute tasks** (Agents). In real-world scenarios, these two capabilities are often tightly coupled: Agents must reason about temporal sequences when orchestrating complex task chains, and time series systems frequently need Agent-like mechanisms for anomaly handling, decision support, and automated response.

- **Scenarios**
  - **Time series forecasting and decision-making** : In domains such as finance, energy, transportation, weather, and IoT, massive streams of time-stamped data must be modeled for trend forecasting, risk early-warning, and resource scheduling.
  - **Anomaly detection and change point detection** : In industrial equipment monitoring, financial fraud detection, and network security, AI must identify rare but high-impact events and pinpoint moments when system behavior shifts.
  - **Spatio-temporal modeling and prediction** : In transportation networks, power grids, and geospatial analysis, both spatial topology and temporal evolution must be considered simultaneously for prediction and optimization.
  - **Agents and tool use** : Large models serve as "brains," invoking external tools (search engines, code interpreters, APIs, databases) to accomplish complex tasks beyond pure text generation.
  - **Workflow orchestration and multi-Agent collaboration** : Breaking down complex tasks into multi-step workflows, potentially involving multiple Agents with different roles, each handling planning, tool use, code execution, or verification.
- **Principles**
  - **Time series representation and decomposition** : Decomposing time series into trend, seasonal, and residual components, using differencing and transforms to achieve stationarity, forming the basis of classical statistical methods (ARIMA, SARIMA, VAR).
  - **Deep time series modeling** : Learning temporal dependencies with RNN/LSTM/GRU; capturing long-range dependencies with Transformer; modeling multi-scale patterns with CNN + temporal convolutions or WaveNet-style architectures.
  - **Anomaly detection principles** : Using statistical tests, isolation forests, autoencoders, or contrastive learning to distinguish "normal" from "abnormal"; or framing it as change point detection to identify moments when data-generating distributions shift.
  - **Spatio-temporal graph modeling** : Using Graph Neural Networks (GNN) or Spatio-Temporal Transformer to jointly learn spatial topology and temporal dynamics, applied to traffic flow, grid load, and meteorological grid forecasting.
  - **Tool Calling and Function Calling** : Mapping model outputs to structured tool calls (JSON Schema / Function Signature), with the runtime environment executing the tool and returning results to the model, extending its reasoning and action space.
  - **Workflow and Agent orchestration** : Decomposing tasks into multi-step graphs, supporting conditional branching, parallel execution, and loops; multi-Agent systems achieving complex goals through message passing and role division.
- **Models**
  - **Classical time series models** : ARIMA / SARIMA family (including differencing, seasonal, and multivariate VAR); Cointegration and Granger Causality analysis; State Space Models (SSM) and Kalman Filters.
  - **Deep time series models** : RNN/LSTM/GRU for sequence modeling; Transformer for time series (Informer, Autoformer, PatchTST, etc.); TCN (Temporal Convolutional Network); N-BEATS and N-HiTS.
  - **Anomaly detection models** : Statistical tests (CUSUM, EWMA); Isolation Forest and One-Class SVM; Autoencoder reconstruction error; Change point detection with Bayesian Online Change Point Detection (BOCPD).
  - **Spatio-temporal models** : STGCN, Graph WaveNet, DCRNN for traffic flow; Climate and weather large models (Pangu-Weather, GraphCast, FourCastNet).
  - **Agent and tool-use models** : GPT-4 + Plugins / Function Calling; ReAct framework; AutoGPT, BabyAGI and other autonomous Agent prototypes; LangChain / AutoGen and other orchestration frameworks.
  - **Workflow and multi-Agent frameworks** : LangGraph, CrewAI, MetaGPT and other multi-Agent frameworks; Enterprise workflow engines (BPM + Agent).

Starting from this layer, AI systems transition from "single model, single task" to "multi-model, multi-tool, multi-step" compound systems: they must consider not only model accuracy but also orchestration logic, error recovery, security permissions, and human-AI collaboration processes, marking a critical leap from "AI capabilities" to "AI systems."

---

## 6.1 Classical Time Series Forecasting (Classical TS Forecasting)

Before deep learning became widespread, time series forecasting relied primarily on a family of statistical and classical machine learning methods. These approaches are well-grounded in theory, highly interpretable, and remain the backbone of many business forecasting systems in finance, energy, macroeconomics, and supply chain domains. Their core idea is to model the **intrinsic statistical structure** of a time series—trends, seasonality, autocorrelation, stationarity—and use historical data to infer future evolution.

- **Scenarios**
  - Macroeconomic indicator forecasting: GDP growth, inflation, unemployment rate, interest rate term structure, etc., using multivariate time series and causal models for policy simulation and scenario analysis.
  - Demand and inventory forecasting: In retail, e-commerce, and manufacturing, forecasting SKU- or region-level demand to drive replenishment, inventory management, and production planning.
  - Energy load and price forecasting: Power system load forecasting, spot electricity price forecasting, and renewable generation forecasting for scheduling and trading decisions.
  - Financial time series analysis: Modeling and forecasting stock prices, indices, FX rates, and volatility—less for precise point forecasts and more for risk assessment, strategy backtesting, and causal analysis.
- **Principles**
  - **Stationarity and differencing** : A core assumption of many classical methods is that the time series is (weakly) stationary (constant mean and autocovariance over time); non-stationary series require differencing or transformation to achieve stationarity.
  - **ARIMA and SARIMA** : AutoRegressive Integrated Moving Average models combine autoregression (AR), differencing (I), and moving average (MA); SARIMA adds seasonal terms to handle periodic patterns.
  - **Multivariate time series and VAR** : When modeling and forecasting multiple interrelated series simultaneously, Vector Autoregression (VAR) captures cross-variable dependencies.
  - **Cointegration and causality** : Analyzing long-run equilibrium relationships (Cointegration) between non-stationary series, and using Granger Causality tests to assess directional influence.
  - **State Space Models and Kalman Filter** : Representing systems in state-space form, using Kalman Filter or smoothing algorithms for recursive estimation, suitable for non-stationary and latent variable modeling.
- **Models**
  - **ARIMA / SARIMA family** : Suitable for univariate stationary or seasonal series, widely used in macroeconomic and business forecasting.
  - **VAR / VECM** : Vector Autoregression and Vector Error Correction Model for multivariate cointegrated series, common in macroeconomics and finance.
  - **Exponential Smoothing family** : Simple, Holt, Holt-Winters methods, used for lightweight business forecasting scenarios.
  - **State Space Models and Kalman Filter** : Representing systems in state-space form, estimated via Kalman Filter or smoothing algorithms.

These classical methods form the "baseline" of time series analysis: even in the deep learning era, they remain widely used for data exploration, benchmarking, and production systems due to their interpretability and data efficiency.

### 6.1.1 ARIMA and SARIMA Family: From Stationarity to Seasonality

The ARIMA family is the most representative model in classical time series forecasting, unifying three mechanisms—autoregression, differencing, and moving average—into a single framework.

- **AR(p) — Autoregressive model**
  - The current value is a linear combination of the previous p values plus white noise:
    $$
    y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \ldots + \phi_p y_{t-p} + \varepsilon_t
    $$
  - Suitable for series with "inertia" or "mean-reversion," such as temperature, load, and macroeconomic indicators.
  - Order selection uses information criteria (AIC / BIC) and PACF (Partial Autocorrelation Function) analysis.
- **MA(q) — Moving Average model**
  - The current value is a linear combination of the current and previous q white noise terms:
    $$
    y_t = \mu + \varepsilon_t + \theta_1 \varepsilon_{t-1} + \ldots + \theta_q \varepsilon_{t-q}
    $$
  - Suitable for series driven by short-lived random shocks, such as event-driven demand or short-term market fluctuations.
  - Order selection uses ACF (Autocorrelation Function) and information criteria.
- **ARIMA(p, d, q) — Differencing + ARMA**
  - For non-stationary series, apply d-order differencing first to achieve stationarity, then fit an ARMA(p, q) model:
    $$
    \phi(B)(1 - B)^d y_t = \theta(B) \varepsilon_t
    $$
  - The standard workflow follows Box–Jenkins methodology: **identification → estimation → diagnostic checking → forecasting** , combined with automated tools (e.g., auto.arima) for order selection.
- **SARIMA(P, D, Q, m) — Seasonal ARIMA**
  - Adding seasonal terms to ARIMA to handle series with clear periodic patterns (weekly, monthly, quarterly):
    $$
    \Phi(B^m)(1 - B^m)^D y_t = \Theta(B^m) \varepsilon_t
    $$
  - Widely used in retail (weekly sales), energy (daily load), and finance (quarterly reports) scenarios.

In practical applications, the ARIMA family is often combined with **Exponential Smoothing** (Holt–Winters), using information criteria to select the best model; meanwhile, the **Exogenous Variable** variant (ARIMAX / SARIMAX) allows incorporating external features (holidays, promotions, weather) to improve forecasting accuracy.

### 6.1.2 Cointegration and Causality: Long-Run Equilibrium and Directional Influence in Multivariate Series

When modeling multiple related time series, it's insufficient to model each series in isolation — the **relationships between series** often carry richer information. Cointegration analysis and causality testing are core tools for understanding the long-run equilibrium and directional influence in multivariate series.

- **Cointegration**
  - **Concept** : Multiple non-stationary series (e.g., I(1) processes) may have a linear combination that is stationary, meaning a "long-run equilibrium relationship" exists between them.
  - **Testing methods** : Engle–Granger two-step method and Johansen test are commonly used to detect whether cointegration exists and to estimate the cointegration vectors.
  - **Applications** : Pairs Trading strategies in finance (exploiting cointegration between two stock prices), long-run equilibrium analysis between macroeconomic variables.
- **VAR (Vector Autoregression)**
  - **Model form** : Treating each variable as an AR process regressed on lagged values of all variables:
    $$
    Y_t = c + A_1 Y_{t-1} + A_2 Y_{t-2} + \ldots + A_p Y_{t-p} + \varepsilon_t
    $$
  - **Advantages** : Captures dynamic interactions between multiple series, suitable for joint forecasting and policy simulation.
  - **Tools** : Impulse Response Function (IRF) and Forecast Error Variance Decomposition (FEVD) analyze the impact of shocks to one variable on others.
- **VECM (Vector Error Correction Model)**
  - Incorporating cointegration constraints into the VAR framework, modeling both short-run dynamics and long-run equilibrium adjustment processes.
  - Suitable for macroeconomic and financial systems where theoretical long-run relationships exist (e.g., money supply and price levels).
- **Granger Causality**
  - **Definition** : If including lagged values of X significantly improves the prediction of Y, then X is said to "Granger-cause" Y.
  - **Testing procedure** : Comparing the predictive performance of restricted and unrestricted VAR models using F-tests or likelihood ratio tests.
  - **Caveats** : Granger causality is "predictive causality," not true causation; it are sensitive to lag selection, stationarity, and omitted variables.

Together, these methods provide a rigorous framework for answering two core questions: "Are these series linked in the long run?" and "Which series leads or influences others?" — making them indispensable in macroeconomics, finance, and policy analysis.

### 6.1.3 State Space Models and Kalman Filter: A Unified Framework for Latent Variables and Non-Stationarity

Many real-world time series cannot be directly observed in their "true state" — what we see is only noisy observations, and the underlying state may be non-stationary, multi-dimensional, and latent. **State Space Models (SSM)** combined with the **Kalman Filter** provide a unified probabilistic framework for such problems.

- **State Space Model structure**
  - **State equation (transition equation)** : Describing how the latent state evolves over time:
    $$
    x_t = F_t x_{t-1} + B_t u_t + w_t, \quad w_t \sim N(0, Q_t)
    $$
  - **Observation equation** : Describing how the observed values are generated from the state:
    $$
    y_t = H_t x_t + v_t, \quad v_t \sim N(0, R_t)
    $$
  - This form naturally accommodates non-stationarity, latent variables, and multi-dimensional systems.
- **Kalman Filter**
  - **Recursive estimation** : At each time step, performing a two-step process of "predict (state prior)" and "update (incorporating observation corrections)," yielding the optimal linear unbiased estimate (under Gaussian assumptions).
  - **Applications** : Target tracking (radar/IMU fusion), navigation positioning (GPS + inertial), macroeconomic latent variable estimation (e.g., output gap).
- **Smoothing and variants**
  - **Kalman Smoother** : Using the full observation sequence to back-adjust historical state estimates, producing a smoother trajectory.
  - **Extended Kalman Filter (EKF) / Unscented Kalman Filter (UKF)** : Extensions to nonlinear systems, using linearization or the unscented transform to approximate nonlinear propagation.
- **HMM (Hidden Markov Model)**
  - **Discrete-state SSM** : The latent state takes discrete values, transitioning via a Markov chain; observations are generated conditional on the state.
  - **Classic algorithms** : Forward–Backward algorithm for inference, Viterbi algorithm for decoding, Baum–Welch for parameter learning.
  - **Applications** : Speech recognition, biosequence analysis, financial regime detection.

In engineering, SSM + Kalman is often combined with domain physical models (kinematic equations, economic models) to achieve "model-based + data-driven" hybrid forecasting and control, forming the backbone of many classical control and signal processing systems.

## 6.2 Deep Learning for Time Series Forecasting

As data volumes grow and tasks become more complex, deep learning is increasingly applied to time series forecasting. These methods can automatically learn complex temporal dependencies from raw data, handle high-dimensional multivariate series, and integrate external features and metadata into a unified model.

- **Scenarios**
  - Large-scale demand and load forecasting: In internet services, energy, and retail, building a single global model across thousands or tens of thousands of series to improve overall forecasting accuracy and consistency.
  - Complex pattern and event forecasting: Capturing irregular events (promotions, holidays, emergencies) and multi-scale cycles (intraday, weekly, yearly) for fine-grained forecasting.
  - Multivariate sensor and IoT forecasting: Jointly modeling multiple related signals (temperature, pressure, vibration, current) from multi-sensor systems for equipment health and process forecasting.
  - Probabilistic and risk forecasting: Outputting not just point forecasts but full probability distributions or quantiles for risk assessment and decision optimization.
- **Principles**
  - **RNN family (LSTM / GRU)** : Encoding time series via hidden states, capturing nonlinear dependencies and long-term memory, suitable for irregular sampling and variable-length sequences.
  - **1D-CNN and Temporal Convolution (TCN)** : Using 1D convolutions or dilated convolutions to extract temporal features, with parallelizable computation, suitable for long sequences and multi-scale feature extraction.
  - **Transformer and attention mechanisms** : Applying Transformer to time series, capturing long-range dependencies with attention; variants like Informer and Autoformer optimize efficiency for long-sequence forecasting.
  - **Pure MLP and DLinear** : Recent research shows that simple linear models or MLPs can match or exceed complex Transformer performance on many benchmarks, prompting reflection on "model complexity vs. overfitting."
- **Models**
  - **RNN family** : LSTM, GRU, and their Seq2Seq variants, used for multivariate time series and probabilistic forecasting (with Mixture Density Network).
  - **TCN / WaveNet family** : Dilated convolution architectures for long-sequence modeling and multi-scale feature extraction.
  - **Transformer family** : Informer, Autoformer, PatchTST, adapting attention mechanisms for time series characteristics (locality, periodicity).
  - **MLP / DLinear family** : N-BEATS, N-HiTS, DLinear, achieving strong forecasting performance with simple structures.

Deep time series models complement classical methods: the former excels at high-dimensional, nonlinear, and large-scale scenarios, while the latter remains competitive in low-data, high-interpretability settings. In practice, they are often used in combination (Ensemble / Hybrid).

### 6.2.1 RNN, LSTM, GRU and Multivariate Time Series: Modeling Long-Range Dependencies

RNN-family models are the first widely adopted deep time series models, introducing "memory" into neural networks, enabling them to process variable-length sequences and capture temporal dependencies.

- **RNN and vanishing/exploding gradients**
  - Standard RNNs unfold into a deep network in the temporal dimension, suffering from vanishing or exploding gradients for long-term dependencies, making training difficult.
- **LSTM (Long Short-Term Memory)**
  - Introducing a gating mechanism (input gate, forget gate, output gate) and cell state, enabling selective memory and forgetting, effectively alleviating the vanishing gradient problem.
  - Suitable for time series with long-term dependencies, such as speech, text, and long-period sensors.
- **GRU (Gated Recurrent Unit)**
  - Simplifying LSTM's three-gate design to two gates (reset gate, update gate), reducing parameter count, often achieving comparable performance to LSTM.
- **Multivariate time series modeling**
  - **Vector input RNN** : Treating multi-dimensional signals at each time step as a vector, inputting into LSTM/GRU, allowing the model to learn cross-variable dependencies.
  - **Seq2Seq + Attention** : Encoder compressing historical sequence, Decoder generating future sequence, with Attention aligning encoder–decoder time steps, used for multi-step forecasting.
  - **Probabilistic forecasting** : Output layer connecting to Mixture Density Network or Quantile Regression to produce distributions or quantiles instead of single point forecasts.

RNN-family models have gradually been replaced by Transformer and MLP-based approaches in some scenarios, but remain competitive in low-latency, online learning, and edge deployment contexts, serving as an important baseline for many industrial time series systems.

### 6.2.2 Transformer for Time Series: Long-Range Attention and Patching Strategies

The success of Transformer in NLP and CV has inspired its application to time series. However, time series has fundamentally different structure than text (continuous values, locality, periodicity), so direct "porting" is suboptimal — a series of targeted adaptations are needed.

- **Challenges of directly applying Transformer to time series**
  - Time series has strong **locality and periodicity** , while point-wise self-attention treats each time step as an independent token, ignoring local patterns.
  - For very long sequences, $O(T^2)$ attention becomes a computational bottleneck.
  - Pure attention mechanisms are prone to overfitting on noise-heavy time series.
- **Informer: ProbSparse Attention and long-sequence forecasting**
  - **ProbSparse Attention** : Selecting a subset of Query–Key pairs based on attention score sparsity, reducing complexity from $O(T^2)$ to $O(T \log T)$.
  - **Distilling** : Gradually reducing temporal dimension via downsampling, focusing on dominant patterns.
  - Suitable for long-sequence forecasting tasks such as electricity, weather, and industrial sensors.
- **Autoformer: Auto-Correlation mechanism**
  - Replacing standard attention with **Auto-Correlation** , detecting periodic patterns in frequency domain and aggregating at the period level.
  - Better leverages time series periodicity, improving forecasting accuracy and efficiency.
- **PatchTST: Patching + Channel-Independent Transformer**
  - **Patching** : Splitting time series into fixed-length subsequence-level Patches as Transformer input units, preserving local temporal structure.
  - **Channel-Independent** : Building independent models for each variable, avoiding noise interference from cross-variable mixing.
  - Achieved SOTA on multiple benchmarks, becoming a mainstream architecture for time series Transformer.

These models demonstrate that to apply Transformer to time series, one must "respect" time series characteristics: locality, periodicity, and multi-scale patterns, rather than simply treating it as a "token sequence."

### 6.2.3 MLP, DLinear and Foundation Models: From Simple Baselines to Large Time Series Models

Recent research has revealed a surprising fact: on many time series benchmarks, simple linear models or MLPs can match or even outperform complex Transformer models. This has sparked deep reflection within the field — and driven exploration of two new directions: **ultra-lightweight models** and **large time series models**.

- **DLinear and N-BEATS / N-HiTS**
  - **DLinear** : Decomposing time series into trend and remainder components, each fitted with a simple linear layer, achieving competitive performance on multiple benchmarks with extremely low parameter count.
  - **N-BEATS** : Building a deep fully-connected network with interpretable blocks, each block outputting basis function expansions for trend and seasonality.
  - **N-HiTS** : Introducing hierarchical interpolation and multi-rate sampling on top of N-BEATS to improve efficiency and accuracy for long-sequence forecasting.
  - The success of these models indicates: time series forecasting doesn't always require complex attention mechanisms; **proper decomposition and basis functions + deep MLP** can suffice.
- **Large Time Series Models and Foundation Models**
  - Inspired by LLMs and Vision Foundation Models, the field is exploring **pre-trained large time series models**.
  - **TimesFM, Chronos, Moirai** : Pre-training on large-scale public time series corpora (finance, energy, weather, IoT, etc.), then fine-tuning or prompting on downstream tasks.
  - **Tokenization strategies** : Discretizing continuous time series (via quantization or Patch embeddings) into token sequences, using Transformer or hybrid architectures for modeling.
  - The goals of these models are:
    - **Zero-shot / few-shot forecasting** : Achieving reasonable accuracy on unseen scenarios and domains.
    - **Cross-domain transfer** : Learning generic time series representations from finance, weather, IoT, and other domains.

In the future, time series systems may adopt a "pyramid structure": lightweight models (DLinear / MLP) at the base for massive real-time forecasting, Foundation Models at the top for cross-domain and cold-start scenarios, with large LLM/Agent systems at the apex unifying time series, text, and business logic for decision-making.

## 6.3 Anomaly Detection and Change Point Detection

In many critical systems, AI's task is not to "predict the future" but to **quickly identify "unusual" events** : equipment failures, fraudulent transactions, network intrusions, market flash crashes, physiological anomalies, and so on. These events are typically rare, diverse in form, and vary over time, making them difficult to cover with fixed rules. Anomaly detection and change point detection methods provide an **unsupervised or weakly supervised** approach to discover "deviations from normal patterns" in real time or near-real time.

- **Scenarios**
  - Industrial equipment and IoT anomaly monitoring: Collecting vibration, temperature, current, pressure, and other signals from sensors to detect early signs of equipment failure, quality deviation, or process anomalies.
  - Financial transactions and risk control: Identifying anomalous transactions such as credit card fraud, money laundering, and wash trading in real time, combining rule engines with model scoring for interception.
  - IT operations and cybersecurity: Monitoring system metrics, logs, and network traffic for failures, intrusions, and DDoS attacks, supporting automated operations (AIOps).
  - Healthcare and biometrics: Detecting arrhythmias in ECG, abnormal patterns in EEG, and anomaly alerts in wearable device data.
- **Principles**
  - **Statistical and distribution-based methods** : Assuming data follows a specific distribution (Gaussian, Poisson, etc.), flagging points that deviate from confidence intervals or control limits; classic tools include Z-score, control charts, CUSUM, and EWMA.
  - **Isolation and density-based methods** : Using Isolation Forest, One-Class SVM, and density estimation (KDE, GMM) to model "normal regions," treating low-density or easily isolated points as anomalies.
  - **Reconstruction error-based methods** : Using Autoencoder, PCA, matrix decomposition, etc., to reconstruct data; anomalous samples have high reconstruction error as they deviate from the learned normal mode.
  - **Change point detection** : Identifying moments when the data-generating distribution changes significantly, such as BOCPD and CUSUM, used for trend shifts and structural breaks.
- **Models**
  - **Statistical methods** : Z-score, control charts (Shewhart, CUSUM, EWMA), Isolation Forest, One-Class SVM.
  - **Reconstruction-based models** : PCA, Autoencoder, VAE, using reconstruction error as the anomaly score.
  - **Self-supervised and contrastive learning** : Learning representations via contrastive learning (e.g., TS2Vec), then using distance or density for detection.
  - **Change point detection** : BOCPD, Kernel-based change point detection, PELT algorithm.

In practice, anomaly detection is typically a multi-layered system: **rule engines** for known patterns, **model scoring** for unknown patterns, and **human review** for high-stakes decisions, together forming a complete anomaly response pipeline.

### 6.3.1 Isolation Forest, One-Class SVM, and Autoencoders: Three Paradigms for Anomaly Detection

Anomaly detection is a typical "small sample, high cost" problem: anomalies are rare, diverse in form, and difficult to label comprehensively. Therefore, most methods adopt an **unsupervised or semi-supervised** paradigm, building models of "normality" and using deviations from normality as the anomaly signal.

- **Isolation Forest**
  - **Core idea** : Anomalies are "few and different," thus easier to isolate. Building random trees that randomly select features and split points; anomalous samples require fewer splits to isolate.
  - **Anomaly score** : Measuring anomaly likelihood by average path length (shorter paths indicate higher anomaly probability).
  - **Advantages** : Computationally efficient, naturally handles high-dimensional data, suitable for initial filtering in large-scale datasets.
- **One-Class SVM**
  - **Core idea** : Learning a maximum-margin hypersphere or hyperplane in feature space to tightly enclose "normal samples," treating points outside the boundary as anomalies.
  - **Kernel methods** : Using RBF kernels and other nonlinear kernels to adapt to complex normal distributions.
  - **Applications** : Intrusion detection, user behavior anomaly detection, often combined with feature engineering.
- **Autoencoder and VAE**
  - **Reconstruction error** : Training an autoencoder to reconstruct normal samples; anomalous samples have high reconstruction error as they deviate from the learned normal manifold.
  - **VAE** : Introducing a latent distribution, using reconstruction likelihood (ELBO) as the anomaly score, suitable for noisy and uncertain data.
  - **Combining domain knowledge** : Designing domain-specific architectures (e.g., convolutional autoencoders for vibration signals, LSTM autoencoders for sequences) to improve detection sensitivity.

These three methods correspond to three paradigms: **random partitioning (Isolation)**, **boundary modeling (Boundary)**, and **reconstruction modeling (Reconstruction)**. They are often used in combination or integrated into a multi-layer detection system to balance sensitivity and false positive rate.

### 6.3.2 Self-Supervised and Contrastive Learning for Anomaly Detection: Learning Discriminative Representations from Unlabeled Data

In many real-world scenarios, large volumes of time series or signal data lack labels, and anomalies are extremely rare and diverse. **Self-supervised and contrastive learning** offer a new path for anomaly detection: first learning generic "good representations" from unlabeled data, then performing detection in the representation space.

- **Self-supervised pre-training**
  - **Masked reconstruction** : Randomly masking portions of time series or signals, training the model to reconstruct (similar to BERT's MLM), forcing the model to learn intrinsic structure and dependencies.
  - **Contrastive learning** : Generating positive samples via data augmentation (jittering, scaling, time warping), treating different instances as negatives, training the model to "pull positives together, push negatives apart."
  - **Representative methods** : TS2Vec, T-Loss, TNC, etc., learning time series representations via instance discrimination or temporal neighborhood contrastive objectives.
- **Anomaly detection in representation space**
  - After pre-training, mapping raw data to the representation space, then detecting anomalies using simple distance metrics, density estimation, or one-class classifiers (e.g., Isolation Forest, One-Class SVM).
  - Advantages: Leveraging large-scale unlabeled data to learn general representations, often more robust than hand-crafted features.
- **Fine-tuning and domain adaptation**
  - When a small amount of labeled data is available, fine-tuning the self-supervised model for specific anomaly types or domains, further improving detection accuracy.
  - Using domain adaptation techniques to transfer representations from one domain (e.g., industrial sensors) to another (e.g., medical signals), reducing annotation costs.

Self-supervised and contrastive methods make anomaly detection feasible under a "no labels or few labels" paradigm, aligning well with many real-world data conditions, and are becoming a key component of next-generation anomaly detection systems.

### 6.3.3 Change Point Detection and Structural Breaks: Identifying Moments of System Change

Unlike detecting individual anomalous points, **change point detection** focuses on identifying **moments when the data-generating mechanism itself changes** : such as sensor drift onset, market regime shifts, process step transitions, or disease outbreaks. These changes often mean "the old model is no longer applicable" and must be detected promptly to trigger model updates, strategy switches, or human intervention.

- **Classic change point detection methods**
  - **CUSUM (Cumulative Sum Control Chart)** : Cumulatively summing deviations of observations from a target value; when the cumulative sum exceeds a threshold, a change is declared. Suitable for detecting mean shifts.
  - **EWMA (Exponentially Weighted Moving Average)** : Applying exponential weighting to observations, more sensitive to recent data, suitable for detecting slow drifts.
  - **Bayesian Online Change Point Detection (BOCPD)** : Using Bayesian inference to recursively compute the posterior probability of the "time since last change point," naturally providing uncertainty estimates.
- **Multi-change point detection and segmentation**
  - **PELT (Pruned Exact Linear Time)** : Efficiently detecting multiple change points in a series via dynamic programming and pruning, guaranteeing global optimality.
  - **Kernel-based change point detection** : Using kernel functions to measure distributional differences between segments, suitable for non-Gaussian and nonlinear scenarios.
  - **Binary Segmentation and Wild Binary Segmentation** : Detecting change points hierarchically, suitable for long sequences and complex signals.
- **Applications and system integration**
  - **Model lifecycle management** : Automatically detecting "concept drift" in input data or labels, triggering model retraining or version switches.
  - **Monitoring and alerting systems** : Setting change point detection at key business metrics or system indicators; upon detection, triggering alerts and automated response processes.
  - **Combined with domain knowledge** : In finance, combining macro events to interpret change points; in industry, linking to maintenance logs and process change records to explain root causes.

Change point detection complements anomaly detection: the former focuses on "system-level structural changes," the latter on "sample-level outliers." Combining both yields a more complete monitoring and alerting system.

## 6.4 Spatio-Temporal Modeling and Intelligent Agents (Spatio-Temporal & Agents)

In the real world, many data sources are neither purely temporal nor purely spatial, but **evolving simultaneously across both dimensions** : traffic flow depends on road network topology (spatial) and time of day (temporal); grid load depends on regional layout and meteorological conditions; geospatial phenomena (pollution diffusion, weather systems) are inherently spatio-temporal. **Spatio-temporal modeling** aims to build models that simultaneously capture "how space connects" and "how time evolves."

Meanwhile, as AI systems grow more complex, a single "input–output" model can no longer meet real-world demands. We need models to **autonomously plan tasks, invoke tools, and collaborate with other models** — this is the goal of **Intelligent Agents and tool use**. In time series and spatio-temporal scenarios, Agents can automatically monitor data streams, invoke anomaly detection models, trigger alerts and automated responses, or participate in larger decision-making systems.

- **Scenarios**
  - Traffic flow forecasting and scheduling: Using road network graph structure and historical flow, forecasting future traffic conditions for navigation, traffic signal control, and public transit scheduling.
  - Grid load and renewable forecasting: Jointly modeling regional distribution, meteorological features, and temporal evolution to support scheduling, peak shaving, and trading decisions.
  - Climate and weather large models: Replacing traditional numerical weather prediction (NWP) solvers with deep learning to provide global or regional medium- and short-term forecasts at minute-level latency.
  - Agents and tool use: LLMs invoking search engines, databases, code interpreters, APIs, and other tools to accomplish complex tasks (information retrieval, data analysis, automated reporting).
  - Workflow orchestration and multi-Agent collaboration: Decomposing complex tasks into multi-step workflows, with multiple Agents handling planning, tool use, code execution, and verification.
- **Principles**
  - **Spatio-temporal graph modeling** : Treating spatial entities (stations, regions, grid nodes) as graph nodes and their relationships (distance, connectivity, similarity) as edges, using GNN + temporal modules (RNN, TCN, Attention) to jointly model spatio-temporal dynamics.
  - **Spatio-temporal Transformer** : Introducing spatial attention and temporal attention into the Transformer architecture, capturing long-range spatio-temporal dependencies, suitable for large-scale forecasting tasks.
  - **Climate and weather large models** : Using deep networks (U-Net, Transformer, Graph-based) trained on reanalysis data (e.g., ERA5) to directly learn mapping from atmospheric state to future state, bypassing traditional PDE solvers.
  - **Tool Calling and Function Calling** : Models outputting structured tool call instructions (JSON / Function Signature), with the runtime environment executing and returning results, extending model capabilities.
  - **Workflow and Agent orchestration** : Decomposing tasks into multi-step graphs supporting conditional branching and parallel execution; multi-Agent systems achieving complex goals through message passing and role division.
- **Models**
  - **Spatio-temporal GNN** : STGCN, DCRNN, Graph WaveNet, for traffic flow and grid load forecasting.
  - **Climate and weather large models** : Pangu-Weather, GraphCast, FourCastNet, GenCast, achieving precision comparable to or exceeding traditional NWP at minute-level latency.
  - **Agent and tool-use models** : GPT-4 + Plugins / Function Calling, ReAct framework, AutoGPT, BabyAGI, etc.
  - **Workflow and multi-Agent frameworks** : LangChain, LangGraph, CrewAI, MetaGPT, integrated into enterprise decision-making and automation pipelines.

This section serves as a bridge, connecting spatio-temporal modeling with Agents and tool use: the former extends AI capabilities to "complex systems in the physical world," while the latter extends them to "multi-model, multi-tool collaborative systems." In subsequent sections, these two directions will be explored in depth within Agents, RAG, and AI for Science.

### 6.4.1 STGCN, Graph WaveNet and Traffic Flow Forecasting: Modeling Spatio-Temporal Graph Data

Traffic flow forecasting is a classic spatio-temporal modeling problem: each road segment or station is a spatial node, connected by road networks or transit lines into a graph; each node's flow (vehicles, passengers) evolves over time. Traditional methods either model each node independently (ignoring spatial correlations) or use grid-based CNNs (forcing non-Euclidean topology into a grid). **Spatio-temporal graph neural networks** provide a more natural modeling approach.

- **STGCN (Spatio-Temporal Graph Convolutional Network)**
  - **Graph convolution module** : Using Graph Convolution or Chebyshev polynomial approximation to aggregate neighborhood information on the spatial graph, capturing spatial correlations between stations or road segments.
  - **Temporal convolution module** : Extracting temporal features with 1D convolutions or gated convolutions along the time axis, suitable for capturing short-term dependencies and periodic patterns.
  - **Stacking structure** : Alternating "spatial convolution – temporal convolution" blocks to progressively learn complex spatio-temporal features.
- **DCRNN (Diffusion Convolutional Recurrent Neural Network)**
  - **Diffusion convolution** : Simulating information diffusion processes on directed graphs using random walk transition matrices, better capturing asymmetric spatial influence.
  - **Seq2Seq architecture** : Encoder encoding historical spatio-temporal sequences, Decoder generating multi-step future forecasts, supporting multi-step forecasting.
- **Graph WaveNet**
  - **Adaptive adjacency matrix** : Learning the spatial dependency structure from data, rather than relying solely on a predefined physical graph, to capture hidden correlations.
  - **Dilated WaveNet convolutions** : Using dilated convolutions along the temporal dimension to efficiently model long-range temporal dependencies.
  - Combining graph convolution and dilated convolution to simultaneously capture spatial topology and long temporal sequences.
- **Product and engineering forms**
  - **Transportation and transit forecasting platforms** : Providing road condition forecasts, bus arrival predictions, and demand forecasting to support navigation apps and scheduling systems.
  - **Smart city and traffic signal optimization** : Combining real-time flow data with spatio-temporal models to dynamically adjust signal timing and alleviate congestion.
  - **Grid load and renewable forecasting** : Modeling regional nodes and meteorological features as spatio-temporal graphs for load and distributed generation forecasting.

These models demonstrate that spatio-temporal graph modeling is a key bridge from "structured data" to "complex systems": once entities are abstracted as nodes and relationships as edges, the same framework extends to more domains (social networks, knowledge graphs, sensor networks).

### 6.4.2 Climate and Weather Large Models: Replacing Traditional Solvers with Deep Learning

Traditional numerical weather prediction (NWP) relies on solving physical partial differential equations (PDEs) such as atmospheric dynamics and thermodynamics, requiring massive supercomputing resources and hours of computation. In recent years, a class of models known as **"Climate/Weather Large Models"** has demonstrated the ability to match or exceed traditional NWP accuracy at **minute-level latency** , marking a paradigm shift in meteorological forecasting.

- **Pangu-Weather (Huawei)**
  - **3D Earth-Specific Transformer** : Designing 3D attention mechanisms based on latitude, longitude, and altitude, respecting the spherical geometry and vertical stratification of the Earth.
  - **Training data** : Training on decades of global atmospheric reanalysis data (ERA5), covering multiple pressure levels and surface variables.
  - **Forecasting capability** : Achieving accuracy comparable to or exceeding ECMWF IFS on medium-range (3–10 day) forecasts, with inference latency in seconds to minutes.
- **GraphCast (Google DeepMind)**
  - **Graph neural network architecture** : Discretizing the global atmosphere into a multi-scale mesh graph, propagating and updating information with Message Passing.
  - **Autoregressive forecasting** : Iteratively generating multi-step forecasts, supporting medium-range predictions up to 10 days.
  - Strong performance on extreme weather events (typhoons, heatwaves) forecasting.
- **FourCastNet (NVIDIA)**
  - **Adaptive Fourier Neural Operator (AFNO)** : Modeling global dependencies in the frequency domain, suitable for high-resolution global forecasting.
  - **Advantages** : High training efficiency, fast inference, suitable for large ensemble forecasting scenarios.
- **GenCast (Google DeepMind)**
  - **Diffusion model + sparse Transformer** : Using diffusion models to generate ensemble forecasts, capturing uncertainty and extreme event probabilities.
  - **Ensemble forecasting** : Generating multiple possible future paths to assess risk and probability, rather than a single deterministic forecast.
- **Product and engineering forms**
  - **Meteorological SaaS and APIs** : Providing global or regional medium- and short-term weather forecasts for downstream applications in agriculture, aviation, and logistics.
  - **Energy and grid forecasting** : Combining meteorological large models with grid load models for renewable generation and demand forecasting.
  - **Climate risk assessment** : Assessulating long-term climate risk (droughts, floods, heatwaves) for insurance, investment, and policy formulation.

The rise of climate and weather large models is a prime example of "AI replacing/augmenting traditional simulation": using deep learning to approximate expensive physics solvers, trading massive offline training costs for online inference speed, enabling "second-level global forecasting."

# 7. Agents & Tool Use (Agents and Tool Use)

When LLMs move beyond "pure text generation," one of the most disruptive directions is transforming models into **autonomous Agents** capable of using tools. In this paradigm, the LLM acts not merely as an "answer generator" but as a **"brain"** that understands goals, plans steps, selects tools, executes actions, and iterates based on feedback. Tool Calling extends the LLM's capabilities to the entire digital world (search engines, databases, code interpreters, APIs, files), while Agents add **goal-driven, multi-step, self-correcting** behavior patterns.

- **Scenarios**
  - Information retrieval and integration: Agents autonomously using search engines, internal knowledge bases, and databases to gather, compare, and summarize information to generate structured reports.
  - Data analysis and visualization: Agents writing and executing code (Python / SQL) to analyze data, generate charts, and interpret results.
  - Automation and RPA: Agents invoking email, calendars, office software, and enterprise system APIs to automate processes (scheduling, form filling, approval routing).
  - Development assistance: Agents invoking terminals, editors, and testing tools in IDEs to complete code generation, debugging, refactoring, and deployment.
  - Complex decision support: Agents orchestrating multiple models (forecasting, optimization, simulation) to provide decision recommendations and reports in domains like finance, healthcare, and supply chain.
- **Principles**
  - **Tool Calling / Function Calling** : Models outputting structured tool call instructions (JSON Schema / Function Signature), with the runtime environment executing and returning results, extending the model's action space.
  - **ReAct (Reasoning + Acting)** : Alternating between reasoning (Chain-of-Thought) and action (tool calls), using reasoning to guide action selection and observations to correct reasoning direction.
  - **Planning and reflection** : Agents decomposing tasks into sub-goals, planning execution paths, and reflecting and adjusting strategies after failures (Reflection / Self-Critique).
  - **Memory and state management** : Short-term memory (conversation history, intermediate results) and long-term memory (knowledge base, user preferences) supporting Agents in complex, long-running tasks.
- **Models**
  - **Tool Calling models** : GPT-4 + Function Calling, Claude + Tool Use, Qwen + Plugins, and open-source models fine-tuned for Tool Calling (ToolLLaMA, etc.).
  - **Agent frameworks** : ReAct, Reflexion, AutoGPT, BabyAGI, LangChain Agents, OpenAI Assistants API.
  - **Development Agents** : Cursor, Devin, OpenHands, SWE-Agent, integrating terminal, editor, and testing tools.
  - **Multi-Agent frameworks** : CrewAI, MetaGPT, AutoGen, LangGraph, orchestrating multiple Agents to collaborate on complex tasks.

Starting from this layer, AI systems transition from "single model" to "model + tools + environment," requiring capabilities not only in language understanding and generation but also in planning, error recovery, security permissions, and human-AI collaboration — making Agents one of the most promising directions for AI's evolution from "capabilities" to "systems."

---

## 7.1 Tool Calling and Function Calling

The key step for LLMs to move from "answering questions" to "doing things" is the ability to **invoke external tools**. **Tool Calling** (also known as **Function Calling**) allows models to output structured function calls or API requests in a predefined format, with the runtime environment executing the actual operations and returning results to the model. This mechanism extends model capabilities from "text in, text out" to the entire digital world.

- **Scenarios**
  - Real-time information retrieval: Models invoking search engines or internal search services to obtain the latest news, stock quotes, weather forecasts, and other dynamic information.
  - Data querying and computation: Models generating SQL or API calls to query databases or BI systems, performing aggregation, filtering, and computation.
  - External service integration: Invoking third-party services (maps, payments, calendars, email) to implement scheduling, navigation, notifications, and other business processes.
  - Code execution and tool chains: Invoking code interpreters (Python REPL, Jupyter kernel) to run computation, plotting, and data analysis, returning results to the model for continued reasoning.
- **Principles**
  - **Function Signature and Schema** : Defining available tools with JSON Schema or OpenAPI, including name, description, and parameter types, injected into the model's prompt or system message.
  - **Structured output and parsing** : Models outputting structured calls (JSON objects or specific token sequences) in designated fields, parsed by the runtime and mapped to actual function calls.
  - **Execution and result return** : Runtime executing tool calls, returning results (text, JSON, charts, errors) to the model, which interprets and generates the final response.
  - **Multi-turn tool use and error recovery** : Supporting multiple tool calls within a single conversation (sequentially or in parallel), with error or timeout recovery mechanisms to maintain task continuity.
- **Models**
  - **Commercial models** : GPT-4 / GPT-4o + Function Calling, Claude + Tool Use, Gemini + Extensions, Qwen + Plugins.
  - **Open-source models and frameworks** : ToolLLaMA, Gorilla, fine-tuned Llama / Qwen for Tool Calling; LangChain Tools and OpenAI Assistants API providing tool management and runtime environments.
  - **Code interpreter and sandboxed environments** : OpenAI Code Interpreter, E2B, Jupyter kernel, providing secure code execution environments.

Tool Calling transforms LLMs from "closed text systems" into "open capability systems," serving as the foundation for Agents and multi-step task orchestration.

### 7.1.1 Tool Description, Selection, and Invocation: From Function Signature to Structured Calls

For LLMs to correctly invoke tools, a complete mechanism is needed to **describe, select, and execute** tools. This is not simply "letting the model call an API," but involves prompt design, structured output, and runtime collaboration.

- **Tool description and registration**
  - **Function Signature / JSON Schema** : Each tool defined by name, description, and parameter schema (JSON Schema), injected into the model's system prompt or dedicated field.
  - **OpenAPI / MCP protocol** : Large-scale tool management using OpenAPI specs or MCP (Model Context Protocol) to uniformly describe REST APIs, database interfaces, and file systems.
  - **Description quality matters** : Tool names, descriptions, and parameter comments directly affect model selection and invocation accuracy, requiring careful design akin to "API documentation."
- **Tool selection and decision-making**
  - **Single-tool invocation** : Models selecting the most appropriate tool and parameters from available tools based on user intent.
  - **Multi-tool combination** : In complex tasks, models need to plan a sequence of tool calls (potentially with branching and parallelism), similar to a "micro-program."
  - **Tool selection strategies** : Models deciding via CoT reasoning which tools to invoke, when to invoke, and what parameters to pass; often combined with "reflection" to check selection rationality.
- **Structured calls and result handling**
  - **Structured output** : Models outputting tool call instructions as JSON objects or specific token sequences, parsed by the runtime into executable calls.
  - **Result return and interpretation** : Tool execution results returned to the model as text, JSON, or errors, which the model interprets to generate the final answer or decide next steps.
  - **Error handling and retries** : Runtime handling timeouts, exceptions, and permission issues, informing the model for retries or strategy switches.

In engineering, Tool Calling is typically encapsulated as a **"tool registry + runtime" middleware** : upstream models focus on intent understanding and call planning, downstream tools focus on implementation, with the middleware handling description injection, output parsing, execution scheduling, and error recovery.

### 7.1.2 ReAct, CoT and Agents: Combining Reasoning and Action

Pure tool invocation lacks "goal-driven" behavior — it cannot autonomously plan, reason, and adjust. **ReAct (Reasoning + Acting)** and related frameworks tightly combine LLMs' reasoning capabilities with tool use, forming the basic behavioral patterns of Agents.

- **ReAct framework**
  - **Alternating Thought – Action – Observation** :
    - **Thought** : Model reasons about the current state (e.g., "I need to find the latest data on this topic").
    - **Action** : Model selects and invokes a tool (e.g., `search("topic keyword")`).
    - **Observation** : Tool returns results, model integrates them into reasoning for the next round.
  - **Advantages** : Making Agent behavior transparent and debuggable, each step has explicit reasoning traces.
- **CoT (Chain-of-Thought) and multi-step reasoning**
  - **Decomposition** : Breaking complex problems into sub-problems, solving step by step.
  - **Self-Correction** : Detecting contradictions or errors in previous steps during reasoning and adjusting strategies.
  - **Combining with tools** : Embedding tool calls at different CoT steps, using computation, retrieval, and execution to support reasoning.
- **Reflexion and self-improvement**
  - **Reflection mechanism** : Agents reviewing their behavior and results after task completion, identifying failures and improvement directions.
  - **Experience accumulation** : Storing reflections in memory or knowledge base for reference in similar future tasks.
  - **Combining with human feedback** : Using human review and correction signals to further optimize Agent strategies.
- **Planning and task decomposition**
  - **Plan-and-Execute** : Generating a complete plan (sub-goal sequence) first, then executing step by step, suitable for long-horizon tasks.
  - **Hierarchical planning** : High-level Agents responsible for strategy and decomposition, low-level Agents responsible for specific tool invocation and execution, forming a multi-layer structure.

ReAct and CoT Agents are shifting LLMs from "single-turn response" to "multi-turn reasoning + action," laying the foundation for subsequent multi-Agent and workflow orchestration.

### 7.1.3 Code Interpreter and Sandboxed Environments: Giving Models "Hands"

In many tasks, text reasoning and API calls alone are insufficient — you need to actually **"run" code** : complex computation, data analysis, chart generation, file processing, etc. **Code Interpreter and Sandboxed Environments** provide a secure and controllable code execution environment, allowing LLMs to truly "get their hands dirty" within defined boundaries.

- **Code Interpreter design**
  - **REPL and Notebook interfaces** : Models generating code (Python, SQL, etc.) sent to an interactive interpreter (REPL) or Notebook kernel (Jupyter), obtaining stdout / stderr and return values.
  - **Multi-language and multi-environment support** : Supporting Python, JavaScript, SQL, and domain-specific languages (R, Julia), configurable with different dependency libraries and runtime environments.
  - **Result types and multimodal returns** : Code execution can return text, JSON, charts (PNG / SVG), files (CSV / PDF), for models to interpret or present directly to users.
- **Sandboxed environments and security isolation**
  - **Containerization and VMs** : Running each code execution in isolated Docker containers or micro-VMs to prevent malicious code from affecting the host.
  - **Permission and resource limits** : Restricting network access, file system access, CPU/GPU time, and memory usage to prevent resource abuse and infinite loops.
  - **Audit and logging** : Recording all code and execution logs for security auditing and debugging.
- **Applications and product forms**
  - **Data analysis and visualization** : Agents writing Python/SQL to analyze user-uploaded data and generate reports and charts.
  - **Automation and scripting tasks** : Agents writing scripts to complete file processing, format conversion, API calls, etc.
  - **Development assistance and debugging** : Development Agents running code and tests in sandboxes, locating bugs and proposing fixes.

Code Interpreter and Sandboxed Environments transform LLMs from "talking" to "doing," becoming critical infrastructure for Agents. Future directions include tighter integration with external systems (databases, cloud services, IoT devices) to become a "universal execution layer."

## 7.2 Workflow Orchestration and Multi-Agent

A single Agent's capabilities are limited — in complex business scenarios, **multiple Agents and multiple models** must collaborate to complete tasks. **Workflow Orchestration** decomposes tasks into structured multi-step flows (potentially with branching, loops, and parallelism), while **Multi-Agent** systems have Agents play different roles (planner, executor, reviewer, summarizer), collaborating through message passing and shared state.

- **Scenarios**
  - Complex business processes: Automating multi-step processes such as "receive requirements → generate proposal → code implementation → automated testing → human review → deployment."
  - Multi-role collaboration: Multiple Agents acting as "product manager, developer, tester, operations" to collaborate on document writing, code development, or data analysis.
  - Decision support and report generation: Orchestrating multiple models (forecasting, optimization, simulation, NLG) to generate decision recommendations and reports.
  - Customer service and sales processes: Agents executing different strategies at different stages of a conversation (intent recognition, product recommendation, objection handling, closing).
- **Principles**
  - **DAG and state machine workflows** : Decomposing tasks into Directed Acyclic Graphs (DAG) or state machines, supporting conditional branching, parallel execution, and loops.
  - **Message passing and shared state** : Agents communicating via message queues or shared memory, passing intermediate results and control signals.
  - **Role division and collaboration patterns** : Common patterns include Planner–Executor, Reviewer–Executor, Multi-Agent Debate, achieving division of labor through role definition.
  - **Human-in-the-Loop (HITL)** : Inserting human review and confirmation steps in critical decision points to ensure safety and compliance.
- **Models**
  - **Workflow engines** : LangGraph, Prefect, Airflow, integrated with Agent frameworks for structured task orchestration.
  - **Multi-Agent frameworks** : CrewAI, MetaGPT, AutoGen, LangGraph, supporting role definition, message passing, and task allocation.
  - **Enterprise Agent platforms** : Salesforce Agentforce, ServiceNow AI Agents, Microsoft Copilot Studio, packaging workflows and Agents into configurable business solutions.

Workflow and Multi-Agent mark AI systems' evolution from "single model" to "multi-model, multi-role, multi-step": they must consider not only model capabilities but also orchestration logic, error recovery, security permissions, and human-Ai collaboration, making them core components of the next generation of intelligent systems.

### 7.2.1 DAG, State Machine and Workflow Engines: Structuring Multi-Step Tasks

In complex business processes and AI applications, it's insufficient to rely on a single model or tool to complete tasks — **multiple steps must be orchestrated** : retrieval, computation, generation, review, notification, and so on. **Workflow Engines** provide a declarative way to describe and execute these multi-step tasks, typically based on **DAG (Directed Acyclic Graph)** or **State Machine** models.

- **DAG workflow model**
  - **Nodes and edges** : Each node represents a task step (model call, tool invocation, condition check), edges represent dependencies and data flow.
  - **Conditional branching and parallelism** : Selecting different branches based on intermediate results; independent nodes can execute in parallel to improve efficiency.
  - **Loops and retries** : Supporting loop structures on certain nodes (e.g., "retry until passing") or the entire process, suitable for iterative optimization.
- **State machine workflow model**
  - **States and transitions** : Systems defined as finite states, transitioning between states based on events or conditions, suitable for conversation flows and approval processes.
  - **Event-driven** : Triggering state transitions and actions via external events (user input, API callbacks, scheduled tasks).
- **Workflow engines and tools**
  - **General engines** : Prefect, Airflow, Temporal, used for data pipelines and task scheduling, integrated with Agent frameworks.
  - **Agent-specific** : LangGraph, using graph structures to describe Agent behavior and state, supporting complex multi-Agent interactions.
  - **Low-code platforms** : Flowise, LangFlow, Dify Workflow, using visual canvases to orchestrate Agent workflows, lowering the barrier to entry.
- **Engineering considerations**
  - **Idempotency and retries** : Each node should be designed as idempotent as possible to support safe retries and failure recovery.
  - **Observability and logging** : Recording execution traces, latency, and intermediate results for each node to facilitate debugging and performance optimization.
  - **Human-in-the-Loop** : Inserting human review steps at critical nodes (content review, strategy confirmation), ensuring safety and compliance.

Workflow engines elevate Agent systems from "free-form scripts" to "structured programs," providing the necessary foundations for reproducibility, testability, and security — making them the foundation of enterprise-grade Agent systems.

### 7.2.2 Multi-Agent Collaboration: Division of Labor, Debate, and Self-Play

When tasks become sufficiently complex, a single Agent often struggles to handle everything: planning, execution, review, and summarization may require different "expertise" and perspectives. **Multi-Agent Collaboration** has multiple Agents play different roles, achieving higher-quality outputs through **division of labor, debate, and self-play**.

- **Role division and collaboration patterns**
  - **Planner – Executor** : Planner Agent responsible for task decomposition and strategy formulation, Executor Agents responsible for specific tool calls and code execution.
  - **Generator – Reviewer** : Generator Agent producing initial drafts (code, documents, proposals), Reviewer Agent responsible for review and feedback, forming an iterative loop.
  - **Multi-Agent Debate** : Multiple Agents presenting different viewpoints and arguments on the same issue, reaching higher-quality conclusions through debate, used for complex decisions and creative generation.
  - **Self-Play and adversarial training** : Multiple Agents playing opposing roles (attacker/defender, proposer/challenger), continuously improving capabilities through self-play.
- **Communication and state management**
  - **Message passing** : Agents communicating via structured messages (text, JSON), passing task status and intermediate results.
  - **Shared state and blackboard** : Using shared memory or blackboard systems where Agents read and write state, achieving loose collaboration.
  - **Turn management and scheduling** : Controlling the order and conditions of Agent execution, avoiding deadlocks and infinite loops.
- **Frameworks and engineering implementation**
  - **CrewAI** : Defining Agent teams, assigning roles, goals, and tools, suitable for "team collaboration" style tasks.
  - **MetaGPT** : Simulating software company roles (PM, Architect, Developer, QA), generating code projects through multi-Agent collaboration.
  - **AutoGen (Microsoft)** : Supporting multi-Agent conversations and task orchestration, suitable for research and prototyping.
  - **LangGraph** : Describing multi-Agent interactions with graph structures, supporting complex states and conditional logic.

Multi-Agent collaboration is shifting AI systems from "single-hero mode" to "team collaboration mode": different Agents each leverage their strengths, forming a more robust and creative system through division of labor and adversarial dynamics, making it a key direction for solving complex problems.

### 7.2.3 Enterprise Agents and Human-in-the-Loop: From Prototypes to Production

While Multi-Agent systems show great potential in research and prototyping, deploying Agents in enterprises requires addressing a series of **engineering and governance** challenges: security, compliance, auditability, cost control, and human-AI collaboration. **Enterprise Agents and Human-in-the-Loop (HITL)** patterns are key to bridging the gap from "prototypes" to "production."

- **Enterprise Agent requirements and challenges**
  - **Security and permissions** : Agents accessing enterprise data and systems, requiring fine-grained permission control (RBAC / ABAC) to prevent over-privileged operations.
  - **Audit and compliance** : Recording Agent decision paths, tool calls, and generated content for internal audits and external regulatory requirements.
  - **Cost and performance** : Controlling LLM call frequency and token usage to avoid cost explosion; optimizing latency to meet real-time business requirements.
  - **Explainability and trust** : Providing reasoning traces and decision bases for Agent behavior, so business personnel can understand and trust the results.
- **Human-in-the-Loop patterns**
  - **Approval gates** : Inserting approval steps at critical decisions (send email, modify data, invoke external API), requiring human confirmation before proceeding.
  - **Draft–Review–Publish** : Agents generating draft content (emails, reports, proposals), submitted to humans for review and modification before formal execution.
  - **Exception escalation** : Agents automatically handling routine cases, escalating high-risk or uncertain cases to human agents, forming an "AI-assisted + human-backed" model.
  - **Feedback loops** : Collecting human correction and rating data as training data to continuously optimize Agent strategies and models.
- **Product and platform forms**
  - **Salesforce Agentforce** : Pre-built Agents and workflow templates for CRM and service scenarios, supporting enterprise-level configuration and governance.
  - **ServiceNow AI Agents** : Agents for IT service management (ITSM) and internal processes, integrated with approval flows and permission systems.
  - **Microsoft Copilot Studio** : Allowing enterprises to customize Agents and workflows, integrated with Microsoft 365 and Azure AI services.
  - **Enterprise Agent platforms** : Combining LLMs, tool registries, workflow engines, and governance components to provide unified Agent development, deployment, and operations capabilities.

Enterprise Agents and HITL patterns are bringing Agents from the lab into real business: ensuring safety and compliance through "human-AI collaboration," and achieving continuous optimization through "feedback loops" — making them a critical gateway for AI's evolution from "capabilities" to "value."
### 10.2.1 Protein Structure Prediction: From Sequence to 3D Structure

The core question in protein structure prediction is: given an amino acid sequence (or a multiple sequence alignment), how to accurately predict its three-dimensional structure in space. Represented by AlphaFold2, deep learning has pushed this capability to near-experimental accuracy, fundamentally changing the workflow of structural biology.

- **Sequence → Structure mapping**
  - **Distance and angle prediction** : Traditional methods predict distance distributions and dihedral angles between residue pairs, then reconstruct 3D coordinates through optimization.
  - **End-to-end structure modules** : AlphaFold2's Structure Module directly outputs atomic coordinates, bypassing explicit intermediate geometric representations.
- **MSA and co-evolutionary signals**
  - **Multiple Sequence Alignment (MSA)** : Collecting homologous sequences from databases (UniRef, BFD, MGnify) to construct MSAs; co-evolutionary patterns between residues provide strong priors for folding constraints.
  - **Attention mechanisms** : Using Transformer or Evoformer to model interactions between MSA columns, capturing long-range dependencies.
- **AlphaFold2 and its variants**
  - **AlphaFold2** : Integrating MSA processing (Evoformer), pairwise representation, and structure module, outputting high-precision structures and confidence scores (pLDDT, PAE).
  - **AlphaFold3** : Extending to modeling complexes of proteins, nucleic acids, and small molecules, supporting broader biomolecular structure prediction.
  - **OpenFold, RoseTTAFold** : Open-source implementations and variants, promoting method dissemination and improvement within the research community.
- **Confidence estimation and structure refinement**
  - **pLDDT and PAE** : Outputting per-residue confidence scores and predicted aligned errors to guide "trusted region" selection in downstream applications.
  - **Structure refinement** : Performing local optimization on predicted structures (relax, repack) to improve physical reasonableness.

The success of protein structure prediction demonstrates that deep learning can achieve breakthroughs in "highly structured, physics-constrained" domains: as long as sufficient evolutionary information and appropriate inductive biases are available, data-driven models can rival or even surpass methods based on physical simulation.

### 10.2.2 Complex and Interaction Modeling: From Monomers to Assemblies

In vivo, proteins rarely function in isolation — they form complexes through interactions with other proteins, nucleic acids, and small molecules, carrying out signal transduction, catalysis, and structural support. Modeling these **complexes and interaction interfaces** is key to understanding biological function and drug design.

- **Multi-chain joint modeling**
  - **AlphaFold-Multimer** : Extending AlphaFold2 to multi-chain inputs, introducing chain identification and interface constraints to directly output complete complex structures.
  - **RoseTTAFold and other complex modeling tools** : Achieving multi-chain structure prediction through template information and pairwise representation.
- **Interface prediction and assembly modeling**
  - **Interface residue prediction** : Using graph models or attention mechanisms to identify residues most likely to constitute binding interfaces.
  - **Assembly path inference** : Based on known monomer structures, predicting the most probable assembly configurations using energy scoring or generative models.
- **Protein–nucleic acid and protein–small molecule complexes**
  - **AlphaFold3** : Supporting joint modeling of protein–DNA/RNA and protein–ligand complexes, expanding application scope.
  - **Docking and binding pose prediction** : Combining deep scoring functions (e.g., DiffDock) with conformational search to predict stable binding conformations of small molecules within protein pockets.
- **Applications and product forms**
  - **Drug target interface analysis** : Identifying key residues and binding pockets at protein–protein or protein–nucleic acid interfaces to guide inhibitor design.
  - **Antibody–antigen complex modeling** : Precisely modeling CDR–antigen interfaces to optimize antibody affinity and specificity.
  - **Signal pathway and systems biology** : Constructing interaction network models of multi-protein complexes to support pathway analysis and perturbation experiments.

Complex and interaction modeling bridges the gap from "single-molecule structure" to "biological function": once interface and assembly mechanisms are understood, one can rationally design intervention strategies — which is the core objective of structure-based drug design.

### 10.2.3 Protein Design and Directed Evolution: From Structure to Sequence

Traditional structure prediction addresses the "forward problem" — sequence → structure; while **protein design** tackles the **"inverse problem"** — given a target structure or function, generating sequences that can stably fold into that structure and exhibit the desired function. Combined with directed evolution and high-throughput screening, this capability is redefining the boundaries of synthetic biology and enzyme engineering.

- **Inverse Folding**
  - **Problem definition** : Given a 3D backbone structure (or topological constraints), generating amino acid sequences that fold stably into that structure.
  - **Representative models** : ProteinMPNN, ESM-IF, generating candidate sequences conditioned on structural features.
  - **Applications** : De novo protein design, scaffold optimization, antibody humanization.
- **Functional design and activity optimization**
  - **Function-oriented sequence generation** : Using protein language models (ESM, ProtTrans) or generative models (Diffusion, VAE) to sample novel sequences in functional space.
  - **Activity and selectivity optimization** : Combining structure prediction and energy scoring to design mutation libraries for improved catalytic efficiency or substrate specificity.
- **Directed evolution and variant screening**
  - **Mutation effect prediction** : Using protein language models and structure models to predict the impact of specific mutations on stability (ΔΔG), activity, or binding affinity, reducing experimental screening burden.
  - **Library design** : Combining computational predictions with high-throughput screening (FACS, microfluidics) to iteratively optimize candidate variants.
  - **Closed-loop optimization** : Establishing a "design–synthesize–test–learn" cycle, where AI models participate in each iteration of experimental design and result analysis.
- **Applications and product forms**
  - **Synthetic biology and enzyme engineering** : Designing novel enzymes or metabolic pathways for green chemistry, biofuel, and food synthesis.
  - **Antibody and protein drug optimization** : Iteratively optimizing affinity, stability, and immunogenicity of candidate drugs.
  - **Protein materials and nanotechnology** : Designing proteins with specific mechanical, optical, or self-assembly properties.

Protein design and directed evolution mark structural biology's transition from "understanding nature" to "creating nature": AI not only predicts existing structures but actively participates in designing biomolecules with novel functions, becoming a core engine of synthetic biology.

## 10.3 Physics Simulation and Operator Learning

In engineering and scientific research, many problems rely on **solving complex physical partial differential equations (PDEs)** : fluid dynamics (Navier–Stokes), structural mechanics (elasticity/plasticity equations), electromagnetics (Maxwell's equations), quantum chemistry (Schrödinger equation), etc. Traditional numerical methods (FEM, CFD, MD) are precise but computationally expensive, making them difficult to use for real-time design, optimization, and uncertainty analysis. Deep learning offers a new paradigm: **learning surrogate models or operators** to approximate the input–output mapping of physical simulations, achieving acceleration of orders of magnitude.

- **Scenarios**
  - Aerospace and automotive: Replacing some CFD simulations with deep surrogate models to accelerate aerodynamic shape optimization and flow field prediction.
  - Energy and materials: Accelerating heat transfer, fluid flow, and stress analysis in battery, photovoltaic, and composite material design.
  - Geophysics and environment: Accelerating seismic wave propagation, groundwater flow, and atmospheric/oceanic simulations for risk assessment and resource exploration.
  - Molecular dynamics and materials simulation: Replacing expensive first-principles or classical MD simulations with deep potentials or operator models to access larger scales and longer timescales.
- **Principles**
  - **Physics-Informed Neural Networks (PINN)** : Embedding PDE residuals, boundary conditions, and initial conditions into the loss function, training neural networks to satisfy physical laws without requiring large labeled datasets.
  - **Neural Operator** : Learning mappings between infinite-dimensional function spaces (e.g., initial condition → solution), rather than point-to-point mappings, enabling resolution-independent inference.
  - **Deep potentials and molecular dynamics** : Using neural networks to fit potential energy surfaces, replacing quantum chemistry or empirical potentials to drive molecular dynamics simulations.
  - **Multi-scale and hybrid modeling** : Combining deep surrogate models with physical solvers, using deep models for fast exploration and physical solvers for local refinement, achieving multi-scale coupling.
- **Models**
  - **PINN family** : PINN, DeepXDE, NVIDIA Modulus, used for forward solving and inverse problems of various PDEs.
  - **Neural Operator family** : DeepONet, Fourier Neural Operator (FNO), U-NO, Geo-FNO, used for learning mappings between function spaces.
  - **Deep potentials** : DeepMD, NequIP, Allegro, MACE, used for molecular dynamics and materials simulation.
  - **Surrogate models and hybrid methods** : Combining deep surrogate models with traditional FEM/CFD solvers for multi-fidelity optimization and uncertainty quantification.

Physics simulation and operator learning are redefining the boundaries between "computation" and "learning": once sufficient training data (from simulations or experiments) is available, deep models can accelerate traditional simulations by orders of magnitude while preserving physical constraints, becoming critical tools for accelerating scientific discovery and engineering design.

### 10.3.1 PINN and Physics-Informed Learning: Embedding Laws into Loss Functions

The core idea of **Physics-Informed Neural Networks (PINN)** is: not relying solely on data-driven learning, but **incorporating physical laws (PDEs, boundary/initial conditions, conservation laws) as soft constraints** into the neural network training process. This enables obtaining physically consistent solutions even with scarce data.

- **PINN fundamentals**
  - **Loss function design** :
    $$
    \mathcal{L} = \mathcal{L}_{\text{PDE}} + \mathcal{L}_{\text{BC}} + \mathcal{L}_{\text{IC}} + \mathcal{L}_{\text{data}}
    $$
    where $\mathcal{L}_{\text{PDE}}$ is the PDE residual term, $\mathcal{L}_{\text{BC}}$ and $\mathcal{L}_{\text{IC}}$ are boundary and initial condition terms, and $\mathcal{L}_{\text{data}}$ is the (optional) data fitting term.
  - **Automatic differentiation** : Computing PDE residual terms using automatic differentiation (Autograd), eliminating the need for grid discretization.
  - **Advantages** : Capable of solving forward and inverse problems, naturally handling irregular domains and high-dimensional problems.
- **Variants and improvements**
  - **Adaptive weighting and gradient balancing** : Dynamically adjusting the weights of different loss terms to avoid certain terms dominating training.
  - **Decomposition and domain decomposition** : Splitting complex domains into sub-domains, training separate networks for each (e.g., XPINNs, FB-PINNs).
  - **Variants** : VPINN (variational form), cPINN (conservative form), adapted to different types of PDEs.
- **Applications and product forms**
  - **Forward and inverse problem solving** : Solving fluid, heat transfer, and elasticity forward problems; identifying unknown parameters or source terms from partial observations (inverse problems).
  - **Engineering design optimization** : Using PINN as a fast surrogate model in shape optimization and parameter identification.
  - **Scientific discovery** : Discovering hidden physical parameters or constitutive relations from data, combined with symbolic regression.
- **Tools and frameworks**
  - **DeepXDE, NVIDIA Modulus, SciML** : Open-source PINN libraries supporting various PDE types and boundary conditions.
  - **JAX / PyTorch-based custom implementations** : Leveraging Autograd and JIT compilation for efficient PINN training.

PINN and physics-informed learning represent a new paradigm of "deep learning + physical laws": rather than purely data-driven black boxes, nor purely numerical discretization of physical equations, but a combination — using data to compensate for incomplete physical models and physics to constrain data-driven generalization.

### 10.3.2 Neural Operator and DeepONet: Learning Mappings Between Function Spaces

Traditional deep surrogate models typically learn point-to-point mappings (specific input → specific output), requiring retraining whenever input resolution or discretization changes. **Neural Operator** generalizes deep learning to **mappings between infinite-dimensional function spaces** : once trained, the model can infer at arbitrary resolutions and geometries, approaching a "universal physical solver."

- **DeepONet**
  - **Architecture** : Composed of a Branch network (encoding input functions) and a Trunk network (encoding query coordinates), approximating operator mappings through inner products.
  - **Theoretical foundation** : Universal approximation theorem for operators — neural networks can approximate any continuous operator.
  - **Applications** : Learning solution operators for ODEs/PDEs, Green's functions, and implicit mappings in engineering design.
- **Fourier Neural Operator (FNO)**
  - **Spectral Convolution** : Performing convolution in the frequency domain via Fourier transforms, capturing global dependencies.
  - **Resolution invariance** : Once trained, can infer at different resolutions without retraining.
  - **Applications** : Fluid dynamics, weather forecasting, seismic wave propagation, achieving speedups of orders of magnitude over traditional solvers.
- **U-NO and Geo-FNO**
  - **U-NO** : Adopting a U-Net-style encoder–decoder architecture for operator learning on complex geometries.
  - **Geo-FNO** : Extending FNO to irregular geometries via coordinate transformations, suitable for engineering meshes and real-world domains.
- **Product and engineering forms**
  - **Digital twins and fast simulators** : Building neural operator-based "digital twins" for industrial equipment, aircraft, and energy systems, supporting real-time simulation and optimization.
  - **Uncertainty quantification** : Combining Monte Carlo or Bayesian methods with neural operators to efficiently propagate and quantify uncertainties across physical simulations.
  - **Multi-physics coupling** : Training multiple single-physics operators, then composing them into multi-physics solvers.

Neural Operators are shifting simulation from "solving once per instance" to "solving once, inferring anywhere": once trained, they provide fast approximation capabilities across a class of problems, becoming a key pillar of next-generation scientific computing and engineering design tools.

### 10.3.3 Deep Potentials and Molecular Dynamics: Accelerating Micro-Scale Simulation with Neural Networks

In materials science, chemistry, and biophysics, **molecular dynamics (MD) simulation** is a core tool for understanding atomic/molecular motion, reactions, and phase transitions. However, traditional methods face a dilemma: **empirical potentials are fast but inaccurate; first-principles (DFT) are accurate but slow**. **Deep Potentials** use neural networks to fit high-precision potential energy surfaces, achieving "DFT-level accuracy at MD-level cost."

- **DeepMD and NequIP**
  - **DeepMD** : Representing local atomic environments with rotationally invariant descriptors, training neural networks to fit DFT energy and forces for large-scale MD simulations.
  - **NequIP / Allegro** : Using E(3)-equivariant graph neural networks to directly learn energy and force representations from atomic coordinates, better leveraging symmetry.
  - **MACE** : Higher-order equivariant models, further improving accuracy and data efficiency.
- **Training data and active learning**
  - **DFT data generation** : Running DFT calculations on representative configurations to obtain energies, forces, and stresses as training data.
  - **Active learning** : During MD simulations, triggering DFT recalcation and model updates when the model's prediction uncertainty is high, reducing annotation costs.
- **Applications and product forms**
  - **Materials simulation** : Studying phase transitions, defect migration, and interface reactions in metals, semiconductors, and 2D materials.
  - **Electrolyte and battery materials** : Simulating ion transport and interface reactions in electrolytes to guide battery material design.
  - **Biomolecules and drug design** : Studying protein folding, ligand binding, and membrane protein dynamics to support structure-based drug design.
- **Tools and platforms**
  - **DeepMD-kit, NequIP, MACE** : Open-source deep potential libraries, integrated with LAMMPS and other MD engines.
  - **DFT + ML workflows** : Combining VASP, Quantum ESPRESSO, and other DFT software with ML frameworks to build automated data generation and model training pipelines.

Deep potentials and neural network-accelerated MD are redefining the scale and精度 boundaries of microscopic simulation: once reliable potentials are available, millions of atoms and nanosecond-scale simulations become feasible, becoming critical tools for materials design, drug discovery, and chemical engineering.

## 10.4 Mathematical and Symbolic Reasoning (Math & Symbolic Reasoning)

Large models excel at statistical pattern recognition, but in **formal systems** (mathematics, logic, symbolic computation), they often fall short of **rigorous deduction and proof**. Mathematical and symbolic reasoning attempts to combine LLMs' "intuition" with formal tools (theorem provers, computer algebra systems) to achieve **provably correct** reasoning and discovery in mathematics, physics, and engineering.

- **Scenarios**
  - Mathematical theorem proving: Automatically or semi-automatically proving mathematical propositions, generating formal proofs (in Lean, Coq, Isabelle, etc.).
  - Symbolic computation and equation solving: Performing algebraic simplification, integration, differentiation, and equation solving, as alternatives or complements to traditional CAS (Computer Algebra Systems).
  - Mathematical problem solving and education: Solving competition-level or textbook-level mathematical problems, generating step-by-step solutions.
  - Scientific derivation and engineering computation: Assisting in physical derivation, engineering formula simplification, and numerical-symbolic hybrid computation.
- **Principles**
  - **LLM + formal verifier** : LLMs generating proof sketches or formal code, verified by Lean/Coq/Isabelle for correctness, forming a "generate–verify" loop.
  - **Tree search and reinforcement learning** : Using tree search (MCTS) or reinforcement learning to explore proof paths in formal systems, training models to select optimal strategies.
  - **Symbolic computation integration** : LLMs invoking symbolic computation engines (SymPy, Mathematica, Maple) via tool calls for exact algebraic and calculus operations.
  - **Informal–formal translation** : Training models to translate informal mathematical text into formal languages (Lean, Coq), or conversely, explaining formal proofs in natural language.
- **Models**
  - **Dedicated mathematical models** : Minerva, Gödel, GPT-f, AlphaProof, specialized in mathematical reasoning and proof generation.
  - **LLM + formal tools** : GPT-4 + Lean/Coq, LLM + SymPy/Mathematica, combining language understanding with formal verification.
  - **Mathematical problem solving** : Combining CoT reasoning with tool calls to solve competition and textbook problems.
  - **Scientific derivation assistants** : Combining LLMs with symbolic computation and literature retrieval to assist in physical derivation and engineering computation.

Mathematical and symbolic reasoning represents AI's deep exploration from "statistical pattern" to "formal proof": once models can generate verifiable proofs in formal systems, AI transitions from "empirical assistant" to "rigorous collaborator," opening new possibilities in mathematics, theoretical physics, and formal verification.

### 10.4.1 LLM + Formal Verification: From Proof Sketch to Machine-Checked Proof

A core challenge in mathematical reasoning is: how to ensure model-generated reasoning and proofs are **truly correct**, rather than merely "looking right." **LLM + Formal Verification** addresses this by having LLMs generate proof drafts, and formal verifiers (Lean, Coq, Isabelle) check correctness step by step, ensuring each reasoning step is rigorous.

- **Generate–Verify loop**
  - **LLM generating proof sketches** : Models generating proof outlines or formal code snippets in natural language or semi-formal language.
  - **Formal verifier checking** : Tools like Lean4 verifying each step of the proof; if a step fails, feeding error information back to the model for regeneration.
  - **Iterative refinement** : Multiple rounds of "generate–verify–fix" until a complete and correct proof is obtained.
- **Representative systems**
  - **GPT-f and ReProver** : Using LLMs to generate tactic sequences in Lean, combined with search strategies to explore proof paths.
  - **AlphaProof (DeepMind)** : Combining language models with AlphaZero-style reinforcement learning to explore formal proof spaces, proving competition-level mathematical propositions.
  - **LeanDojo, MLProof** : Open-source Lean–LLM integration frameworks supporting research and experimentation.
- **Informal–formal translation**
  - **Autoformalization** : Training models to translate informal mathematical text (textbooks, papers) into formal languages, building large-scale formal libraries.
  - **Proof explanation** : Translating formal proofs into natural language explanations to help mathematicians understand and review.
- **Applications and product forms**
  - **Mathematical research assistants** : Assisting mathematicians in exploring proof paths, verifying conjectures, and generating formal libraries.
  - **Formal verification and software security** : Extending LLM + formal verification to software specification verification, protocol verification, and security-critical system validation.
  - **Education and automated grading** : Generating step-by-step proofs in educational scenarios and checking student-submitted proofs for correctness.

LLM + Formal Verification is redefining the boundaries between "intuition" and "rigor": once models can generate machine-checkable proofs in formal systems, AI transitions from "empirical assistant" to "rigorous collaborator," opening new possibilities in mathematics, theoretical physics, and formal verification.

### 10.4.2 Symbolic Computation and Equation Solving: Integrating CAS Capabilities into LLMs

Traditional **Computer Algebra Systems (CAS)** such as Mathematica, Maple, and SymPy can perform exact symbolic computations (algebraic simplification, integration, differentiation, equation solving), but require users to master specialized syntax and rules. LLMs possess natural language understanding and "intuition," but are prone to errors in exact computation. Combining the two enables "**understanding requirements in natural language, completing computation with symbolic tools, and interpreting results in natural language**."

- **LLM invoking symbolic computation tools**
  - **Tool Calling integration** : LLMs invoking SymPy, Mathematica, or custom symbolic engines via Function Calling to perform algebraic, calculus, and equation-solving operations.
  - **Code generation + execution** : Models generating SymPy code sent to a sandbox for execution, with results returned to the model for interpretation.
  - **Advantages** : Combining LLM flexibility with CAS rigor, suitable for education, scientific research, and engineering computation.
- **Symbolic regression and equation discovery**
  - **Symbolic regression** : Searching the space of mathematical expressions for formulas that fit data, used in physical law discovery and empirical model construction.
  - **LLM-assisted discovery** : Using LLMs' prior knowledge of physical/mathematical patterns to constrain the search space, combined with symbolic regression tools to generate candidate formulas.
- **Applications and product forms**
  - **Mathematical education and problem solving** : Solving competition and textbook problems, generating step-by-step solutions combining symbolic computation and natural language explanations.
  - **Scientific research and engineering computation** : Assisting in physical derivation, formula simplification, numerical-symbolic hybrid computation.
  - **Data-driven law discovery** : Discovering governing equations from experimental or simulation data to support scientific hypothesis generation.

Integrating symbolic computation into LLMs enables AI to achieve "language understanding + exact computation + result interpretation" in formal systems, becoming a powerful complement and extension to traditional CAS.

# 11. AI Platform Engineering and MLOps

When large models transition from research prototypes to **production infrastructure**, the challenges extend far beyond model quality to encompass **data pipelines, training pipelines, deployment architecture, monitoring and operations, cost control, security, and compliance**. AI Platform Engineering and MLOps constitute the engineering discipline that addresses these challenges: building **reproducible, scalable, governable AI systems** through standardized platforms and automated pipelines.

- **Scenarios**
  - **Enterprise AI platforms** : Providing unified capabilities for data management, model training, deployment, and operations, supporting multi-model, multi-tenant, and multi-region deployments.
  - **MaaS (Model-as-a-Service)** : Exposing model inference and fine-tuning capabilities via APIs, supporting pay-per-use and elastic scaling.
  - **Data flywheel and continuous improvement** : Collecting real usage data to drive continuous model iteration and optimization.
  - **Cost optimization and resource scheduling** : Fine-grained management of compute, storage, and bandwidth to maximize resource utilization.
- **Principles**
  - **Data pipelines and governance** : Standardizing data collection, cleaning, annotation, and versioning to ensure training data quality and traceability.
  - **Training pipelines and experiment management** : Standardizing training, evaluation, and experiment tracking to support reproducibility and comparison.
  - **Deployment and inference optimization** : Using quantization, distillation, caching, and other techniques to reduce inference latency and cost.
  - **Monitoring and operations** : Building multi-dimensional monitoring (infrastructure, services, models) to support alerting, diagnosis, and auto-remediation.
- **Models**
  - **Training frameworks** : Megatron-LM, DeepSpeed, Hugging Face Transformers, TRL.
  - **Deployment frameworks** : vLLM, TGI, Triton, TensorRT-LLM, Ray Serve.
  - **MLOps platforms** : MLflow, Kubeflow, SageMaker, Vertex AI, Azure ML, Weights & Biases.
  - **Monitoring tools** : Prometheus + Grafana, ELK, OpenTelemetry, WhyLabs, Arize AI.

AI Platform Engineering and MLOps are the bridge from "model capabilities" to "business value": only with a complete platform and operational system can large models truly deliver value at scale in enterprises.

---

## 11.1 Model Training and Fine-tuning (Training & Fine-tuning)

Model training and fine-tuning are the starting point of the AI platform engineering system. From **pre-training** to **continued pre-training (Domain-Adaptive Pretraining, DAPT)**, through **supervised fine-tuning (SFT)** and **reinforcement learning from human feedback (RLHF/RLAIF)**, each stage requires specialized data pipelines, training frameworks, and evaluation systems.

- **Scenarios**
  - **Foundation model pre-training** : Training general-purpose base models on large-scale corpora (web pages, books, code, multilingual content).
  - **Industry continued pre-training** : Continued pre-training on domain-specific corpora (medical, legal, financial, manufacturing) to inject industry knowledge and terminology.
  - **Task fine-tuning and instruction tuning** : Fine-tuning for specific tasks (QA, summarization, translation, code) or instruction-following capabilities.
  - **Alignment training (RLHF/RLAIF)** : Aligning model behavior with human preferences and safety standards through reward models and reinforcement learning.
- **Principles**
  - **Pre-training objectives** : Autoregressive language modeling (next-token prediction), masked language modeling, contrastive learning, multimodal alignment.
  - **Distributed training** : Data parallelism, tensor parallelism, pipeline parallelism, ZeRO optimization for large-scale cluster training.
  - **Parameter-Efficient Fine-Tuning (PEFT)** : LoRA, QLoRA, Adapter, Prefix Tuning, enabling fine-tuning with minimal additional parameters.
  - **RLHF/RLAIF pipeline** : Reward model training → policy optimization (PPO, DPO), aligning model behavior with human preferences.
- **Models**
  - **Training frameworks** : Megatron-LM, DeepSpeed, Hugging Face Transformers + PEFT.
  - **RLHF tools** : TRL (Transformers Reinforcement Learning), trlx, DeepSpeed-RLHF, custom RLHF pipelines.
  - **Reward models** : Reward model training, ranking/scoring models, refusal strategies, and alignment policy templates.

In product form, this layer typically manifests as: **foundation model R&D platforms, enterprise "custom training + customization" services, one-click fine-tuning platforms, and model hubs (Model Hub / Model Store)**, supporting the production pathway from "general models" to "thousands of enterprise-specific models."

### 11.1.1 Pre-training and Continued Pre-training: From General Capabilities to Industry Foundation Models

Pre-training is the "source engineering" of modern large model capabilities: through self-supervised learning on massive unlabeled text, code, and multimodal data, models gradually acquire language modeling, world knowledge, basic reasoning, and representation learning abilities. On this basis, continued pre-training (especially **Domain-Adaptive Pretraining, DAPT**) takes on the task of "pulling the model toward a specific vertical domain."

In the **general pre-training** stage, core focuses include:

1. **Corpus scale and diversity** : Mixing web text, books, code, conversations, multilingual content, and multimodal data such as image-text pairs to cover the broadest possible range of knowledge and expression forms.
2. **Training objectives and multi-task mixing** : Beyond classic autoregressive language modeling, sometimes incorporating fill-in-the-blank, next-sentence prediction, contrastive learning, and image-text alignment objectives to enhance semantic alignment and multimodal understanding.
3. **Multilingual capabilities and alignment** : Using shared vocabularies or subword encodings, along with cross-lingual parallel corpora or alignment tasks, enabling models to represent different languages in a unified vector space, achieving **cross-lingual transfer and translation**.

In the **industry continued pre-training (DAPT)** stage, the focus shifts to:

1. **Industry corpus construction** : Building specialized corpora from medical records and guidelines, legal judgments and regulations, financial research reports and trading data, manufacturing/energy/game design documents.
2. **Style and terminology adaptation** : Through continued pre-training on large volumes of domain-specific text, enabling models to naturally master industry terminology, fixed expressions, professional writing styles, and tacit knowledge (e.g., clinical documentation conventions, legal phrasing).
3. **Enterprise-specific knowledge injection** : For large enterprises or institutions, further incorporating internal documents, knowledge bases, and work order records beyond general + industry corpora, training "enterprise-specific large models" as a unified intelligence foundation.

In engineering practice, pre-training and continued pre-training operate with large-scale distributed frameworks (Megatron-LM, DeepSpeed ZeRO, etc.) and efficient data pipelines (WebDataset / HF Datasets + object storage), forming **stable and reusable training pipelines**. For cloud providers or large companies, this pipeline is often encapsulated as an internal platform supporting periodic incremental pre-training and parallel iteration of multiple industry foundation models.

### 11.1.2 Fine-tuning Paradigms and RLHF: From "Able to Speak" to "Business-Aware and Boundary-Respecting"

After building a powerful pre-trained foundation, making models "useful for business" and "behaviorally controllable" depends on the fine-tuning and alignment stages. This includes both traditional supervised fine-tuning (SFT) and instruction tuning, multi-task fine-tuning, and reinforcement learning from feedback (RLHF / RLAIF).

At the **fine-tuning paradigm** level, approaches can be broadly categorized as:

1. **Full Fine-tuning**
   In scenarios where task distributions differ greatly from pre-training, or where maximum performance is required and compute is abundant (e.g., specific programming language models, specific language/industry dialogue models), updating all parameters directly achieves the highest performance ceiling. However, costs are high and version management is complex, so it's typically used only for a few core models.
2. **Parameter-Efficient Fine-Tuning (PEFT)**
   Using Adapter, LoRA / QLoRA, Prefix / P-Tuning methods, only inserted "small incremental parameters" or low-rank weight increments are trained, while original large model weights remain frozen. This offers three engineering advantages:
   1. Multiple tasks/clients can share the same base model, only switching different Adapter/LoRA weights.
   2. Significantly reduces memory and compute requirements, enabling fine-tuning on small-to-medium GPU clusters or single-machine environments.
   3. Frequent updates and simple rollbacks, facilitating rapid experimentation and A/B testing.
3. **Instruction Tuning and Task Fine-Tuning**
   1. **Instruction Tuning** : Using "natural language instruction + input + expected output" samples, teaching models to understand human instruction forms like "help me..." "please explain...", eliminating the need for task-specific templates.
   2. **Single-task fine-tuning** : Fine-tuning exclusively for vertical tasks such as customer service QA, code completion, or legal consultation, maximizing performance on that task.
   3. **Multi-task fine-tuning** : Hosting multiple tasks simultaneously on a unified model (QA, summarization, translation, code, recommendation reasoning), improving model versatility and resource utilization.

At the **behavioral alignment and safety** level, **RLHF / RLAIF** plays a critical role:

1. **Reward Model training** : Collecting human or AI preferences (rankings/scores) over multiple candidate responses, training a reward model that evaluates "response quality."
2. **Reinforcement learning (e.g., PPO) optimizing the base model** : Under the reward model's guidance, adjusting model parameters through reinforcement learning to better align with human preferences and platform values, such as:
3. Being more polite, neutral, and professional;
4. Refusing or safely rewriting requests related to danger, violations, or privacy;
5. Expressing uncertainty when uncertain, rather than fabricating facts.
6. **RLAIF and self-supervised alignment** : In some scenarios, using strong base models as feedback providers, or combining rules and automated evaluation, for semi-automated alignment of the fine-tuning process, reducing human annotation costs.

On the toolchain side, Hugging Face Transformers + PEFT, TRL / trlx, DeepSpeed-RLHF and other frameworks have essentially established a **standard industrial workflow** from SFT → RM training → RLHF. In product terms, this layer typically manifests as: **model customization/training services, one-click fine-tuning platforms, multi-tenant model marketplaces, and industry/enterprise-specific large model engineering platforms**.

## 11.2 Model Deployment and Inference (Serving & Optimization)

After training a large model, providing inference services with **high availability, low latency, scalability, and cost efficiency** is the second pillar of the AI engineering system. The deployment and inference layer connects GPU/NPU compute clusters on one end and API gateways, enterprise applications, and open platforms on the other. Its core responsibilities include: **deployment architecture design, model routing strategies, inference performance optimization, and hardware utilization**.

Overall, this layer must solve three problems: **what architecture to use for external serving**, **how to make inference faster and cheaper**, and **how to maintain high availability and governability across multi-model, multi-region, multi-tenant environments**.

- **Scenarios**
  - Enterprise internal AI platform / model service bus: Providing unified large model APIs for all business lines, abstracting underlying model and hardware differences.
  - Public cloud APIs: Offering standardized inference interfaces to external developers and ecosystem partners, supporting multi-model selection and version management.
  - High-QPS online services: Customer service assistants, search, recommendations, and office assistants with extremely high latency and stability requirements.
  - Low-cost offline generation: Ad/game copywriting, knowledge base generation, batch code refactoring — throughput and cost-oriented batch processing tasks with low real-time requirements.
  - Cross-region, multi-cluster deployment: Providing就近 access for global or multi-region users, supporting multi-cloud or hybrid cloud configurations.
- **Principles**
  - Deployment architecture and model routing:
    - **Single-model service** : In early or simple scenarios, serving all requests with one primary model — architecturally simple but difficult to balance latency and cost.
    - **Multi-model service and routing** : Configuring models of different sizes or specializations based on task type, latency requirements, cost constraints, and user tiers, with rule-based or Meta-model routing (including A/B testing, multi-armed bandit strategies, etc.).
    - **Multi-tenant isolation and SLA management** : In multi-client scenarios, ensuring performance and security isolation between tenants through resource quotas, QPS limits, access authentication, and SLA tiering.
    - **Elastic scaling and high availability** : Leveraging Kubernetes / Service Mesh infrastructure for auto-scaling, multi-replica deployment, canary releases, blue-green deployments, and cross-region disaster recovery.
  - Inference performance optimization:
    - **Model compression and acceleration** : Reducing computation and memory footprint through quantization (INT8 / INT4 / NF4 / GPTQ / AWQ), pruning/sparsification, and knowledge distillation.
    - **System-level optimization** : Caching attention key-values with KV Cache to accelerate long conversations and continuous inference; balancing throughput and latency through batching, parallel token generation, and streaming output; reducing memory access and kernel launch overhead through operator fusion and graph optimization.
    - **Heterogeneous hardware utilization** : Building adapted runtimes and scheduling strategies for GPU, CPU, NPU, FPGA, and ASIC, leveraging NVLink / RDMA high-speed interconnects for multi-GPU and multi-node scenarios.
  - Engineering and operations:
    - Using dedicated inference frameworks like vLLM, TGI, Triton to significantly reduce development costs.
    - Cross-platform deployment and operator-level optimization through ONNX Runtime, TensorRT, TVM, OpenVINO and other compilers and runtimes.
    - Building unified **online inference clusters and traffic scheduling layers** with Kubernetes, Ray, Service Mesh, and API gateways.
- **Models**
  - Serving frameworks and inference services:
    - vLLM, TGI (Text Generation Inference), Triton Inference Server.
    - Ray Serve, KServe, TorchServe, SageMaker Endpoint, Vertex AI Endpoint, etc.
  - Cluster and scheduling:
    - Kubernetes (K8s), Kubeflow, Ray, Slurm.
    - Service Mesh: Istio / Linkerd (supporting canary, rate limiting, circuit breaking, fallback, and other traffic governance).
  - API gateways and authentication:
    - Kong, NGINX / APISIX / Envoy.
    - IAM / Keycloak / Auth0, cloud provider API Gateways, OAuth2 / OIDC, etc.
  - Model compression and performance libraries:
    - Quantization: NVIDIA TensorRT-LLM / TensorRT, Intel Neural Compressor, OpenVINO (PTQ / QAT), BitsAndBytes, GPTQ, AWQ, AutoGPTQ.
    - Pruning/sparsity: PyTorch Sparse, TensorFlow Model Optimization Toolkit, SparseML, Neural Magic.
    - Distillation: DistilBERT / TinyBERT reference implementations, or custom distillation pipelines based on Hugging Face Trainer + custom distillation loss.
  - Inference engines / runtimes and graph optimization:
    - ONNX Runtime, TensorRT, OpenVINO Runtime, TVM, MNN, NCNN.
    - LLM-specific inference engines: SGLang, vLLM, FasterTransformer, TGI, LMDeploy, DeepSpeed-Inference.
    - Compilation and graph optimization: TVM, XLA (JAX/TF), TensorRT Graph Optimizer, TorchDynamo / TorchInductor, MLIR, Glow, ONNX Graph Optimizer, Intel NNCF, etc.
  - Hardware and heterogeneous support:
    - GPU: CUDA / cuDNN / cuBLAS, ROCm (AMD).
    - CPU: oneDNN (MKL-DNN), OpenBLAS, Eigen.
    - NPU / specialized accelerators: Ascend CANN, Habana Gaudi, Graphcore IPU SDKs, etc.

On the product side, this layer typically appears as **enterprise AI platforms / model service buses, public cloud APIs, unified inference gateways, high-QPS online inference clusters, low-cost batch processing platforms, and compute utilization optimization solutions** — serving as the runtime "operating system" for scaling large model capabilities.

### 11.2.1 Deployment Architecture and Model Routing: From Single-Model to Multi-Model Service Mesh

In early experimentation, many teams choose to serve with a single "large and comprehensive" model as the **sole entry point**: all requests are processed by the same model. This pattern is architecturally simple and low-maintenance, suitable for POCs and low-traffic scenarios. But as business scales and cost pressures rise, the shortcomings of single-model architecture quickly become apparent:

1. Different tasks have different latency/cost/quality requirements; processing all requests with one large model causes **compute waste**.
2. Different industries and clients need differentiated capabilities (e.g., industry-specific models, client-specific fine-tuned weights), which are difficult to manage uniformly in "single-model" mode.
3. Canary releases, A/B testing, and cross-region disaster recovery require flexible scheduling across multiple model versions.

Therefore, mature large model serving systems typically evolve toward **multi-model service with intelligent routing** architecture:

1. **Multi-model pool and model catalog** : Simultaneously maintaining models of various sizes (small / base / large / ultra), specializations (general / code / multimodal / industry-specific), and versions (v1 / v1.1 / client-customized), with unified registration and management at the service layer.
2. **Routing strategies** :
3. **Rule-based routing** : Explicit selection based on request parameters (task type, user tier, latency/cost preferences) and business rules (mandatory specific models for certain industries/regions).
4. **Model selector (Meta-model)** : Using a lightweight model to automatically select the optimal model based on input content, historical performance, and real-time metrics (e.g., fast small model vs. slow large model).
5. **A/B / Bandit routing** : Online experimentation between old/new models or different configurations, automatically converging to the better solution based on CTR, user satisfaction, task success rate, etc.
6. **Multi-tenant isolation and quota management** :
7. Layering tenant-level quota controls, QPS limits, access authentication, and SLA tiering on top of model routing to ensure resource and data isolation between clients.
8. Through **logical isolation + physical isolation (dedicated clusters or dedicated nodes)** for high-compliance scenarios in finance/healthcare/government.
9. **Elastic scaling and high availability** :
10. Auto-scaling based on Kubernetes HPA / VPA, Cluster Autoscaler.
11. Ensuring service stability through multi-replica deployment, load balancing, canary releases, blue-green deployments, and multi-region disaster recovery.

Technically, the combination of **Kubernetes + Service Mesh (Istio / Linkerd) + API Gateway (Kong / APISIX / Envoy) + model serving framework (vLLM / TGI / Triton / Ray Serve / KServe)** is commonly adopted, forming a **service mesh-based inference platform** that supports multi-model, multi-tenant, traffic governance, and canary releases.

### 11.2.2 Inference Performance Optimization and Hardware Acceleration: Minimizing "Cost per Inference"

In large-scale commercial deployment of large models, inference costs are often the largest ongoing expense. Compressing **per-request cost (Cost per Request / per Token) and end-to-end latency** to acceptable ranges while maintaining user experience is the core technical challenge of the deployment layer.

On the **model side**, common approaches include:

1. **Quantization**
   Compressing weights and activations from FP16 / BF16 to lower-bit formats like INT8 / INT4 / NF4, significantly reducing memory footprint and bandwidth overhead.
   1. Post-Training Quantization (PTQ): e.g., GPTQ, AWQ, BitsAndBytes — offline quantization of existing models.
   2. Quantization-Aware Training (QAT): Considering quantization error during training/fine-tuning to improve post-quantization accuracy.
2. **Pruning & Sparsity**
   Removing unimportant weights or channels through structured/unstructured pruning, sparsifying the model, and combining with hardware-friendly sparse operators (e.g., NVIDIA sparse matrix acceleration) to improve inference speed.
3. **Distillation**
   Using a large model as teacher to distill knowledge into a smaller student model or task-specific model, maintaining near-equivalent task performance while dramatically reducing parameter count, suitable for latency-sensitive online services or edge deployment.

On the **system and runtime side**, key optimization points include:

1. **KV Cache and long-context optimization** :
   Caching attention key-values of historical tokens during autoregressive generation to avoid redundant computation, improving efficiency for long conversations and multi-turn requests; combined with chunked computation and dynamic trimming strategies to control memory overhead.
2. **Batching and parallel generation** :
   Dynamic batching, group scheduling, and parallel token generation across multiple requests to improve overall throughput without significantly increasing P95 latency; combined with streaming output to improve front-end interaction experience.
3. **Operator and graph optimization** :
   Using compilers and runtimes (e.g., TensorRT, TVM, ONNX Runtime, TorchInductor) for operator fusion, memory layout optimization, and static graph compilation to reduce kernel launch and memory access overhead.
4. **Heterogeneous hardware scheduling** :
   Allocating workloads across GPU, CPU, NPU, FPGA and other heterogeneous resources based on task computational characteristics and latency requirements:
5. Latency-critical and high-concurrency dialogue/search requests are preferentially scheduled to GPU/NPU.
6. Batch generation, offline evaluation, and log replay tasks can be scheduled to CPU or low-cost GPU/NPU.

In terms of tools and frameworks, TensorRT-LLM, SGLang, vLLM, FasterTransformer, LMDeploy, DeepSpeed-Inference and others have established a relatively mature **large model inference acceleration ecosystem**. On the business side, these optimizations ultimately manifest as: **high-QPS, low-latency online inference clusters, low-cost batch generation platforms, compute utilization optimization solutions, and MaaS/API billing and cost accounting systems**.

## 11.3 Data and Model Operations (Data / Model Ops)

Once large models enter production, they are no longer "one-time delivery" static assets but dynamic systems requiring continuous iteration across **data, models, configurations, versions, and experiments**. The Data / Model Ops layer is the engineering paradigm built around this reality: from data flywheels and model lifecycle management to online experimentation and automated releases, providing the foundation for **sustainable improvement and controllable evolution** of model capabilities.

This layer connects data lakes/warehouses, logs, and collection systems on one end, and training platforms, evaluation systems, and online service gateways on the other — serving as the hub that closes the "data–model–business feedback" loop.

- **Scenarios**
  - Enterprise data platform + model training integration: Connecting data collection, cleaning, annotation, and management to training/fine-tuning pipelines, supporting continuous multi-model iteration.
  - "Continuous improvement mechanism" for C-end/B-end AI applications: Data flywheels driven by user feedback and usage data.
  - Shared data management and annotation workbench for annotation and algorithm teams: Supporting task assignment, quality inspection, and version rollback.
  - Enterprise-level ModelOps platform: Unified recording and management of all model versions, evaluation results, and release statuses.
  - Online experimentation and canary system: Supporting A/B testing, multi-model small-traffic trials, and automatic selection and traffic expansion.
  - Model hosting services: Providing "upload once, deploy to multiple environments, manage multiple versions" model management capabilities for partners/clients.
- **Principles**
  - Data management and data flywheel:
    - **Data collection and governance** : Collecting samples from business logs, user conversations, public data, and partner data; performing deduplication, noise reduction, desensitization, format unification, and quality assessment.
    - **Annotation and feedback loop** : Building high-quality annotated data through expert annotation combined with crowdsourcing and quality inspection mechanisms; feeding back user thumbs-up/thumbs-down, corrections, and human review to the training sample pool.
    - **Data Flywheel** : After model deployment, continuously collecting real usage data → selecting high-value samples (e.g., model errors, low-confidence, high-impact tasks) → retraining or fine-tuning → model improvement → new usage, forming a positive feedback loop.
  - Model lifecycle and release:
    - **Model version management** : Maintaining clear version numbers (major/minor), training data versions, configuration parameters, evaluation results, safety reports, and change records for each model.
    - **CI/CD and automated pipelines** : Automatically triggering evaluation and safety checks after training completion, passing regression tests and threshold gates, only allowing canary releases and full rollouts when key metrics don't degrade excessively.
    - **Experimentation and traffic allocation** : Using A/B testing, multi-armed bandit and other online experimentation methods to compare multi-version models, automatically selecting the best based on real-time business metrics (e.g., task success rate, ticket resolution rate, user satisfaction).
- **Models**
  - Data lakes and warehouses:
    - Delta Lake, Apache Hudi, Iceberg, Hive, BigQuery, Snowflake, etc., for unified storage and management of large-scale structured/unstructured data.
  - Streaming data processing:
    - Kafka, Pulsar, Flink, Spark Streaming, etc., for real-time log, user conversation, and event stream ingestion.
  - Feature and sample management:
    - Feast and other Feature Stores, custom sample warehouses, ML Metadata Stores for recording samples, features, and training metadata.
  - Annotation and quality inspection platforms:
    - Label Studio, Scale-like platforms, custom annotation systems supporting multi-task annotation, quality inspection, and personnel management.
  - MLOps / ModelOps platforms:
    - MLflow, Kubeflow, SageMaker, Vertex AI, Azure ML, Weights & Biases, etc., for managing training experiments, parameters, metrics, and model artifacts.
  - Model registry and version management:
    - MLflow Model Registry, SageMaker Model Registry, W&B Artifacts, etc.
  - CI/CD tools:
    - GitHub Actions, GitLab CI, Jenkins, Argo CD, Flux, etc., for building model continuous delivery pipelines.

### 11.3.1 Data Flywheel and Training Loop: Making Models "Smarter with Use"

In traditional software development, version upgrades are typically plan-driven; in the large model era, **data and feedback** become the primary drivers of iteration. The data flywheel's goal is to make "model usage → data accumulation → retraining → model upgrade" an automatically rolling closed loop, making models **progressively better** in real business scenarios.

Core stages include:

1. **Online data collection and filtering**
   In chatbots, Copilots, search QA, code assistants, and other applications, every user interaction is a potentially high-value training sample. Through logging systems and event tracking, structurally collecting requests, model responses, and user behaviors (clicks, adoption), with privacy desensitization and field trimming at the collection point to avoid introducing compliance risks.
2. **High-value sample mining**
   Selecting the most valuable small subset of samples from massive logs, for example:
   1. Clearly incorrect or user-downvoted responses, for "correction-style" retraining.
   2. Difficult long-form questions and complex workflow task samples, for improving model capabilities in "long-chain reasoning / multi-step tool calling."
   3. Typical business cases and high-value tickets, for building industry/enterprise-specific capabilities.
3. **Annotation and quality control**
   Performing human or semi-automated annotation on candidate samples (including expected responses, quality rankings, safety labels), ensuring annotation quality through multi-round quality inspection, review, and spot checks, providing reliable data for subsequent SFT or RLHF.
4. **Continuous retraining and evaluation for release**
   Periodically adding new samples to the training set, performing SFT / DAPT / RLHF retraining, and simultaneously evaluating "offline metrics + online performance" through standard benchmarks and online A/B experiments, ensuring the new version is overall superior to the old version, preventing the data flywheel from "veering in the wrong direction."

In mature form, most operations of the data flywheel are automatically encapsulated within **Data / Model Ops platforms**: from data collection, sample selection, annotation task dispatch, to model retraining triggers, evaluation result collection, and release decisions, minimizing manual operations and making model iteration a stable and controllable engineering process.

### 11.3.2 Model Lifecycle and ModelOps: From Experimental Models to Production Assets

As the number of models and versions grows exponentially, without rigorous lifecycle management, problems like "models scattered everywhere, version chaos, and difficult rollbacks" easily arise. ModelOps's goal is to manage models as **first-class engineering assets** — fully traceable, comparable, and rollbackable throughout their lifecycle.

Key points include:

1. **Versioning and metadata management**
   Assigning clear version numbers to each model (e.g., `industry-legal-base-v1.2.3`), and recording:
   1. Training data version and time range;
   2. Training configuration (hyperparameters, training script version, code commit used);
   3. Evaluation metrics (general benchmarks + business-specific benchmarks);
   4. Safety evaluation and alignment policies (e.g., sensitive topic response policy version);
   5. Deployment / decommission / rollback history.
2. **End-to-end automated pipeline (CI/CD for Models)**
   Encapsulating the "model training complete → automated evaluation → safety and bias checks → canary release → full release" process into a CI/CD pipeline.
3. Automatically blocking deployment if offline evaluation metrics don't meet preset thresholds.
4. Automatically reducing traffic or rolling back to the previous version if online A/B experiment performance is poor.
5. **Multi-version coexistence and traffic scheduling**
   In production environments, multiple model versions typically coexist (e.g., `stable` / `canary` / `experimental`), compared online through traffic allocation strategies (fixed ratio, user dimension, feature dimension).
   1. A/B testing focuses on stable statistical conclusions;
   2. Multi-armed Bandit automatically balances exploration and exploitation, accelerating convergence to the better-performing version.
6. **Compliance and audit support**
   For industries like finance, healthcare, and government, maintaining traceable records for every model version change: who upgraded the model from which version to which version, based on what data, when, and what the impact assessment was. This is typically linked with the **security and compliance infrastructure** described in Section 11.5.

In engineering implementation, tools like MLflow / SageMaker / Vertex AI / W&B already provide relatively mature ModelOps capabilities; most enterprises build secondary encapsulations on top of these, tailored to their own processes, constructing unified **internal model registries and release platforms**.

## 11.4 Monitoring, Cost, and Reliability

When large models become core business infrastructure, ensuring they are **observable, alertable, scalable, and cost-controllable** becomes the core responsibility of SRE and platform teams. The monitoring, cost, and reliability layer combines traditional observability systems with large model-specific metrics, building multi-dimensional views for operations, algorithm, and management teams.

This layer connects monitoring collection and log/tracing systems on one end, and business KPIs and cost analysis platforms on the other — serving as the key pillar for keeping model services "stable, fast, and economical."

- **Scenarios**
  - Operations/SRE monitoring dashboard: Unified display of CPU/GPU utilization, QPS, latency, error rates, alerts, etc.
  - Algorithm team data and model quality monitoring platform: Monitoring input data distribution, model drift, prompt engineering effectiveness, and RAG hit rates.
  - Management service health dashboard: Binding business KPIs (conversion rate, satisfaction, task completion rate) with model metrics.
  - AI cost analysis and optimization platform: Breaking down compute costs by model, project, and business line, supporting budget management and cost optimization strategies.
  - Intelligent scheduling and elastic scaling system: Automatically scaling or switching model specifications based on load and budget.
  - External MaaS/API billing and cost accounting system: Supporting billing by call volume, token count, and compute usage.
- **Principles**
  - Monitoring and observability:
    - **Multi-layer monitoring** : From infrastructure layer (CPU / GPU / memory / network / storage) to service layer (QPS, P50/P95/P99 latency, error rates, timeout retries), to model layer (token usage, context length distribution, response length, common error types).
    - **Logging and distributed tracing** : Recording requests/responses through structured logs (under desensitization premises), carrying model version, routing decisions, and tenant information; using distributed tracing tools to record the full request path from API gateway → model service → downstream systems.
    - **Alerting and analysis** : Setting threshold alerts, anomaly detection, and trend analysis, linked with business metrics, costs, and safety events for rapid diagnosis and recovery.
  - Cost control and elastic scheduling:
    - **Cost analysis** : Breaking down GPU/CPU/storage/bandwidth costs by model, project, and business line, computing per-request average cost and marginal costs for different tasks/clients.
    - **Elastic scheduling** : Using peak-valley time-of-use strategies, auto-scaling during peaks and auto-shrinking during valleys; scheduling offline batch tasks to nighttime or low-load periods.
    - **Strategic degradation and on-demand acceleration** : Automatically switching to smaller models, shorter contexts, or more conservative inference configurations when resources are tight; automatically using larger models or longer contexts for high-value requests.
- **Models**
  - Monitoring and visualization:
    - Prometheus + Grafana, VictoriaMetrics, Thanos and other metrics collection and visualization solutions.
  - Log systems:
    - ELK (Elasticsearch + Logstash + Kibana), EFK (Fluentd / Fluent Bit), OpenSearch, etc.
  - Distributed tracing:
    - OpenTelemetry, Jaeger, Zipkin, etc.
  - Model-specific monitoring:
    - WhyLabs, Arize AI, Fiddler, Evidently AI, etc., for data/model drift monitoring and output quality assessment.
  - Cost accounting and allocation:
    - K8s Metrics / Cost Exporter, Kubecost, and cloud provider Cost Management tools (AWS Cost Explorer / GCP Billing / Azure Cost Management).
  - Resource scheduling and elastic scaling:
    - K8s HPA / VPA, Cluster Autoscaler, Volcano, Ray Cluster Autoscaler.
  - Task orchestration:
    - Argo Workflows, Airflow, Prefect, Dagster, etc.

### 11.4.1 Monitoring and Observability: From Infrastructure to Model Behavior

In large model systems, traditional CPU/memory/QPS metrics are insufficient — a "model perspective" monitoring layer must be added to truly see system health. A complete observability system typically includes:

1. **Infrastructure and service layer monitoring**
   Collecting and visualizing through Prometheus / Grafana, VictoriaMetrics, etc.:
   1. Node/Pod-level CPU, GPU, memory, disk, and network usage;
   2. Service-level QPS, P50/P95/P99 latency, error rates, timeout retry ratios, connection counts;
   3. Cluster-level resource utilization and capacity warnings.
2. **Model layer metrics monitoring**
   For large model services, beyond standard performance metrics, specialized monitoring is needed:
   1. Token consumption per request (input/output), context length distribution;
   2. Response length and truncation ratios, to diagnose quality issues caused by context/output length limits;
   3. Common error type statistics (e.g., over-length input, model timeout, tool call failures).
3. **Logging and distributed tracing**
   1. Using structured logs to record request parameters (after desensitization), model version, routing decisions, tenant identifiers, return codes, etc.
   2. Using OpenTelemetry, Jaeger, Zipkin to trace a request's full path through API gateway → model service → downstream systems → callback chain, facilitating latency bottleneck and fault point identification.
4. **Anomaly detection and intelligent alerting**
   Beyond traditional threshold alerts, introducing simple statistical monitoring or ML models for anomaly detection on QPS, latency, error rates, token distributions, automatically alerting when sudden changes occur, and triggering self-healing strategies (e.g., auto-scaling, traffic switching, service degradation).

For algorithm teams, tools like WhyLabs, Arize, and Evidently AI can be connected at this layer for long-term tracking of input distributions, model output features, and drift conditions, providing signals for subsequent data flywheel and retraining.

### 11.4.2 Cost Analysis and Elastic Scheduling: Finding the Balance Between "Experience" and "Budget"

One of the most notable operational challenges of large model services is **high and volatile costs**. Without granular cost analysis and elastic scheduling, it's easy to lose visibility into "where the money is burning" during business growth, making timely adjustments difficult. A mature cost and resource scheduling system typically includes:

1. **Cost attribution and allocation**
   Using Kubecost, cloud provider billing tools, and custom ledgers to break down GPU/CPU/storage/bandwidth costs by model, project, business line, and tenant, enabling every team and client to see their actual resource consumption and expenses.
2. **Per-request cost and marginal cost analysis**
   1. Computing per-model/per-task average request cost (Cost per 1k tokens / per request), comparing cost-effectiveness across different models and configurations.
   2. Analyzing marginal costs for different clients and business scenarios, providing a basis for pricing strategies (API billing), SLA tiering, and product packaging.
3. **Elastic scaling and peak-valley utilization**
   1. Auto-scaling through K8s HPA / VPA, Cluster Autoscaler, Ray Autoscaler, ensuring no overload during peaks and no idle resources during valleys.
   2. Scheduling offline tasks (e.g., batch content generation, log replay, offline evaluation) to nighttime or off-peak hours to improve overall GPU utilization and smooth the cost curve.
4. **Strategic degradation and on-demand acceleration**
   1. Automatically triggering degradation strategies when resources are tight or costs exceed budget: using smaller models, shortening context or output, reducing parallelism.
   2. Automatically using larger models, longer contexts, or richer tool-calling capabilities for high-value requests (e.g., paid premium users, critical business processes), achieving "compute allocation by value."

In external API scenarios, this layer is deeply integrated with billing systems, forming a **MaaS/API billing and cost accounting platform**: billing by token usage, call count, model specification, and request type, while providing cost and margin analysis for operations/sales.

## 11.5 Security, Access Control, and Compliance Infrastructure

Once large model capabilities enter high-sensitivity industries like finance, healthcare, and government, security and compliance cease to be "added value" and become **prerequisites for entry**. The security, access control, and compliance infrastructure layer builds system-level defenses from **access control, data security, privacy protection to compliance auditing**, ensuring model services operate reliably within legal and regulatory frameworks.

This layer connects identity authentication, access management, key, and encryption systems on one end, and model services and log/audit platforms on the other — making the difference between "a model that works" and "a model you dare to use."

- **Scenarios**
  - On-premise large model platforms for high-compliance industries (finance/healthcare/government): Requiring data to stay within the domain, auditable, and traceable.
  - Enterprise unified AI access control and audit gateway: Unified authentication, access management, and audit logging for all model calls.
  - Multi-tenant SaaS/cloud platforms: Requiring strict security isolation and compliance support for different clients at both logical and physical levels.
  - Partner/ecosystem-facing open interfaces: Requiring granular access control and quota limits for API calls, meeting compliance requirements (e.g., GDPR).
- **Principles**
  - Access control and tenant isolation:
    - Identity authentication via API Key / Token / OAuth / SSO.
    - Fine-grained access management through RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control) across model, feature, call frequency, and data scope dimensions.
    - Isolating **data, logs, configurations, and model weights** in multi-tenant environments to prevent cross-tenant access and information leakage.
  - Data security and privacy protection:
    - TLS encrypted transport, storage encryption, and centralized key management (KMS) for data security in transit and at rest.
    - Log desensitization and data minimization strategies, retaining only information necessary for business and optimization, with access auditing.
    - Privacy-enhancing technologies (e.g., data anonymization, differential privacy, federated learning) in necessary scenarios to further reduce privacy risks.
  - Compliance and auditing:
    - Full-trace auditing for key operations such as model releases, configuration changes, permission changes, and routing policy adjustments.
    - Recording traceable metadata for every request: request source, model version, decision basis (e.g., knowledge base / tool usage).
    - Ensuring system design and operation comply with industry regulatory requirements in finance, healthcare, government, and local/cross-border data compliance standards.
- **Models**
  - Identity authentication and access management:
    - Keycloak, Auth0, Okta, cloud provider IAMs (AWS IAM / GCP IAM / Azure AD).
    - OPA (Open Policy Agent) + Rego Policy and other policy engines for unified policy management and enforcement.
  - API security gateways:
    - Kong, Apigee, Envoy, cloud provider API Gateways, etc.
  - Data and key security:
    - KMS (Key Management Service), HashiCorp Vault.
    - TLS termination, Confidential Computing, etc.

### 11.5.1 Access Control and Tenant Isolation: Ensuring "Who Can Use What, and How Much"

In large model platforms used by multiple business lines, clients, and roles, without granular access control and tenant isolation, serious problems like privilege abuse, data leakage, and resource contention easily arise. A comprehensive access and isolation system needs to coordinate across several dimensions:

1. **Identity authentication and single sign-on**
   Unified identity authentication for internal employees, external partners, and third-party applications through API Key / Token, OAuth2 / OIDC, and enterprise SSO. For enterprise users, integration with existing identity systems (e.g., AD / LDAP / enterprise IAM) to avoid duplicate account systems.
2. **Fine-grained access control (RBAC / ABAC)**
3. RBAC: Configuring accessible models, environments (test/production), operations (call/configure/release), and quotas separately for administrators, algorithm engineers, business operators, regular users, and partners.
4. ABAC: Introducing attributes like tenant ID, project ID, data domain, and time period on top of roles for more flexible policies (e.g., "only allow government tenant A to call on-premise model clusters in the local region").
5. **Multi-tenant isolation and quota management**
   1. At the logical level, isolating different clients' calls, data, and logs by tenant ID;
   2. At the physical level, providing dedicated clusters or dedicated nodes for high-compliance clients (e.g., banks/government) to achieve higher-level isolation;
   3. Configuring different tenants' QPS limits, concurrent connections, and token quotas to prevent "one tenant's traffic spike from crashing the entire platform."
6. **Access auditing and policy evaluation**
   1. Audit logging for key operations (e.g., creating/deleting API Keys, adjusting permissions, modifying quotas);
   2. Using policy engines like OPA / Rego for unified evaluation and interpretation of complex access policies before execution, reducing the risk of "policies scattered in code."

Through these mechanisms, platforms can open large model capabilities to internal and external users while ensuring resource and data security, while providing foundational data for subsequent compliance auditing and incident investigation.

### 11.5.2 Data Security, Privacy, and Compliance Auditing: Making Models "Useful and Compliant"

Large models often access large volumes of sensitive data (user conversations, business documents, transaction records), and security or compliance failures can have extremely serious consequences. Therefore, "multi-layered protection" is needed throughout the data lifecycle and model call chain.

1. **Data transport and storage security**
   1. Uniformly enabling TLS encryption for all external and internal interfaces to prevent eavesdropping or tampering during transport;
   2. Using encrypted storage for sensitive data, with cloud provider or custom KMS for key lifecycle management;
   3. Using tools like Vault for centralized management of keys and credentials needed to access databases, object storage, and third-party APIs.
2. **Minimization principle and desensitization**
   1. Collecting only data fields necessary for business, and removing personally identifiable information (PII) and sensitive fields from logs and training samples as much as possible;
   2. Hashing or anonymizing identifiers that must be retained to reduce leakage risk;
   3. In RAG/knowledge base scenarios, implementing access-level permissions for documents to ensure models don't retrieve information from "documents they shouldn't see."
3. **Privacy-enhancing technologies and edge constraints**
   1. In scenarios requiring model sharing without raw data sharing, introducing differential privacy or federated learning to balance privacy and performance;
   2. For government, finance, and healthcare scenarios, adopting "data stays in domain, model sinks or deploys locally" patterns, deploying training/inference capabilities within compliant domains.
4. **Compliance and audit mechanisms**
   1. Approval workflows and audit trails for model releases, configuration changes, and permission adjustments for post-incident traceability;
   2. Recording metadata for each request — model version, caller, routing decisions, data access scope — for review during disputes or investigations;
   3. Periodically outputting compliance reports (e.g., data access audits, permission usage records, anomaly event reports) to meet internal risk control and external regulatory requirements.

These capabilities work in conjunction with the Data / Model Ops and monitoring platforms from Sections 11.3 and 11.4, together forming a model operating environment that is "both continuously iterable and securely compliant."

## 11.6 Application Enablers and Platform Capabilities

With complete infrastructure from training to inference, security, and operations, a "capability layer" facing business and developers is still needed to abstract underlying large models into more usable, business-semantic components and services. This layer is typically called the **AI platform, application enabler layer, or Copilot platform**, with the responsibility of: packaging large models + RAG + Agents + workflows into standardized capabilities, enabling business teams and ecosystem partners to rapidly build AI applications.

This layer connects model APIs, RAG engines, and Agent Orchestrators on one end, and CRM/ERP/OA/ticket and other business systems on the other — serving as the key bridge from "model capabilities" to "business scenarios."

- **Scenarios**
  - Enterprise AI platform / Copilot platform: Providing unified dialogue, RAG, Agent, and other intelligent capabilities for internal systems like CRM, ERP, OA, customer service, marketing, and R&D.
  - Application development platform for developers and ecosystem partners: Enabling third parties to rapidly build and deploy AI applications through SDKs, template projects, and visual orchestration tools.
  - AI backend for industry SaaS products: Such as intelligent customer service clouds, marketing clouds, office collaboration clouds, R&D management clouds — embedding AI capabilities into existing product ecosystems.
  - Vertical scenario assistants: Code Copilot, sales assistant, operations assistant, legal assistant, medical assistant — rapidly assembling scenario-specific solutions through platform capabilities.
- **Principles**
  - Dialogue and Agent capabilities:
    - **Session management and memory** : Maintaining multi-turn dialogue state and long-term memory, supporting topic switching, context compression, and personalized profiling.
    - **Tool Use and workflow orchestration** : Connecting models with external systems (databases, search, business APIs, third-party services) through function calls or plugin mechanisms; using Workflow / Orchestrator to chain multi-step operations in complex tasks.
    - **Multi-Agent collaboration** : Splitting complex tasks into different roles (e.g., planner, executor, reviewer), completing task decomposition and result aggregation through collaboration.
  - RAG and knowledge bases:
    - **Document parsing and preprocessing** : Parsing, chunking, and structuring PDF, Word, web, and scanned documents.
    - **Vectorization and retrieval** : Using Embedding models to vectorize text/tables/code, building vector indices; combining keyword and vector retrieval for high recall.
    - **Retrieval + Generation (RAG) and evidence chains** : Retrieving relevant content from knowledge bases at inference time, then having large models generate responses based on retrieval results, outputting citations and evidence chains for improved accuracy and explainability.
    - **Knowledge graphs and structured knowledge fusion** : Combining domain knowledge graphs, business data tables, rule systems, and LLMs to improve handling of structured queries and complex constraints.
  - Developer integration and secondary development:
    - **Multi-language SDKs and API design** : Providing SDKs for Python/JS/Java/Go, encapsulating call patterns, retry, and idempotency handling.
    - **Templates and low-code/no-code building** : Enabling non-professional developers to build RAG/Agent/Workflow through prefabricated template projects and visual "building block" tools.
    - **Plugins and middleware** : Providing plugins or middleware for common business systems (CRM/ERP/OA/ticket systems) to reduce system integration costs.
- **Models**
  - Dialogue/Agent frameworks:
    - LangChain, LlamaIndex, Haystack, Semantic Kernel, etc.
    - Custom orchestration layers: Typically including Workflow Engine, Tool Router, and Memory management modules.
  - RAG and vector retrieval:
    - Vector databases: FAISS, Milvus, Qdrant, Weaviate, Pinecone, etc.
    - Document parsing: unstructured, Textract, pdfplumber, Apache Tika, etc.
  - SDK / integration layer:
    - Official or custom SDKs, front-end component libraries (chat components, prompt template management, conversation history views).
    - Middleware/plugins for business systems (CRM/ERP/OA/ticket, etc.).

### 11.6.1 Dialogue and Agent Orchestration: From "QA Bot" to "Task Collaboration Entity"

Compared to early FAQ-style QA bots, modern large model-driven applications are more like "intelligent collaborators that can use tools." The goal of dialogue and Agent orchestration is to upgrade large models from "language generators" to agents capable of **calling tools, executing plans, and coordinating multiple roles**.

1. **Dialogue management and memory mechanisms**
   1. Maintaining dialogue context, user profiles, and long-term memory, ensuring consistency and coherence across multi-turn interactions;
   2. Compressing overly long conversations through summarization and retrieval-based memory to avoid context "overflow";
   3. In enterprise applications, incorporating identity and permission information into dialogue context, ensuring responses and operations comply with the user's permissions in business systems.
2. **Tool Use and workflow orchestration**
   1. Providing models with structured tool lists (e.g., "check order," "create ticket," "query inventory," "call search engine"), enabling models to proactively invoke tools when needed through function call interfaces;
   2. Using Orchestrators to coordinate the sequence, data flow, and error handling of multiple tool calls based on the model's proposed plan;
   3. Modeling complex business processes (e.g., approval flows, reimbursement, after-sales handling) as workflows, enabling Agents to play the role of "process coordinator."
3. **Multi-Agent collaboration patterns**
   1. Splitting complex tasks into multiple roles: e.g., "task planning Agent," "information retrieval Agent," "execution Agent," "quality inspection/review Agent";
   2. Achieving inter-Agent collaboration through message channels or shared memory, improving robustness and explainability for complex tasks;
   3. In enterprise environments, incorporating human roles into the collaboration loop, e.g., "AI drafts – human reviews – AI revises – system executes."

This layer typically leverages existing frameworks like LangChain, Semantic Kernel, and LlamaIndex, combined with custom Orchestration services, unifying dialogue, tools, workflows, permissions, and auditing within a single "Agent platform."

### 11.6.2 RAG, Knowledge Bases, and Developer Platforms: Connecting Enterprise Knowledge "Into the Model's Brain"

No matter how powerful large models are, they cannot natively master every enterprise's private knowledge, nor can they know the latest policies, products, and business rules in real time. RAG + knowledge bases + developer platforms are the key pathway for engineering **enterprise knowledge, industry knowledge, and real-time data** into model capabilities.

1. **Document parsing and knowledge ingestion**
   1. Using components like unstructured, Textract, pdfplumber, and Tika to parse PDFs, Office documents, web pages, and scanned images into structured text;
   2. "Chunking" by chapters, titles, semantic blocks, etc., to provide appropriate granularity for subsequent vectorization and retrieval;
   3. Building corresponding schema mappings and access interfaces for structured information such as tabular data, business databases, and API documentation.
2. **Vectorization, indexing, and retrieval reranking**
   1. Using Embedding models to convert text/code/multimodal content into vectors, storing in FAISS, Milvus, Qdrant, Weaviate, Pinecone and other vector databases;
   2. Maintaining keyword indexing and metadata filtering capabilities (e.g., filtering by tenant, department, document type), combining into high-precision "pre-filter + semantic retrieval + reranking" pipelines;
   3. At query time, feeding retrieval results along with the original question into the large model for "Retrieval-Augmented Generation (RAG)," returning citations and evidence chains.
3. **RAG application templates and low-code building**
   1. Providing prefabricated RAG templates for common scenarios (knowledge QA, policy interpretation, product documentation, internal document assistants);
   2. Rapidly building specialized knowledge assistants through visual configuration interfaces (selecting knowledge sources, setting chunking rules, choosing vector models and large models);
   3. Exposing these capabilities to developers in SDK form, supporting rapid embedding in Web, mobile, desktop, or business system plugins.
4. **Developer platform and ecosystem integration**
   1. Providing Python/JS/Java/Go SDKs and front-end components (chat bubbles, document citation areas, feedback buttons) to lower integration barriers;
   2. Providing plugins or middleware for mainstream business systems (CRM/ERP/OA/ticket), enabling AI capability integration with "a few configuration checkboxes";
   3. Opening application development platforms externally, enabling ecosystem partners to build their own industry applications based on foundation models, RAG, and Agent capabilities, forming a positive cycle of "platform–ecosystem–end clients."

This layer ultimately encapsulates complex model and infrastructure capabilities into "reusable, composable business components," helping enterprises — under the premises of **security, compliance, and controllable costs** — transform large models into genuine productivity tools driving business innovation, with lower barriers and greater speed.
