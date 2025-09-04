import re
import pandas as pd
import numpy as np
from langdetect import detect_langs
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import nltk
import logging

# Download resources
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')
nltk.download('omw-1.4')

# Initialize stemmers/lemmatizers
malay_stemmer = StemmerFactory().create_stemmer()
english_lemmatizer = WordNetLemmatizer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedMalaysianPreprocessor:
    def __init__(self, domain_stopwords=None):
        self.stopwords = self._load_stopwords(domain_stopwords)
        self.colloquial_map = self._create_colloquial_map()
        self.property_terms = {
            'tnb': 'electricity', 'bil': 'bill', 'sewa': 'rent',
            'penyewa': 'tenant', 'pemilik': 'owner', 'aircond': 'air conditioning',
            'caj': 'charge', 'ansuran': 'installment', 'tunggakan': 'arrears'
        }
        logger.info("Preprocessor initialized with %d stopwords", len(self.stopwords))
    
    def _create_colloquial_map(self):
        """Comprehensive Malaysian colloquial mappings"""
        base_map = {
            'sgt': 'sangat', 'skrg': 'sekarang', 'tq': 'terima kasih',
            'u': 'you', 'btw': 'by the way', 'k': 'ok', 'la': 'lah',
            'dlm': 'dalam', 'tak': 'tidak', 'x': 'tidak', 'dgn': 'dengan',
            'sbb': 'sebab', 'smpi': 'sampai', 'skit': 'sikit', 'tu': 'itu',
            'ni': 'ini', 'kat': 'di', 'tgk': 'tengok', 'nk': 'nak',
            'bleh': 'boleh', 'skali': 'sekali', 'org': 'orang'
        }
        # Add inverse mappings (proper to colloquial) for context preservation
        inverse_map = {v: k for k, v in base_map.items()}
        return {**base_map, **inverse_map}
    

    def _load_stopwords(self, domain_stopwords):
        """Multilingual stopwords with domain customization"""
        # Base English stopwords
        stop_words = set(stopwords.words('english'))
        
        # Malay stopwords
        malay_stopwords = [
            'ada', 'adalah', 'ah', 'akan', 'akankah', 'aku', 'amat', 'anda', 
            'antaranya', 'apa', 'apabila', 'bagaimana', 'banyak', 'beberapa', 
            'begitu', 'beliau', 'berada', 'berapa', 'boleh', 'dalam', 'dan', 
            'dapat', 'dari', 'daripada', 'degan', 'di', 'dengan', 'dia', 
            'hanya', 'harus', 'ia', 'ialah', 'ini', 'itu', 'jangan', 'juga', 
            'kalau', 'kami', 'kamu', 'karena', 'kata', 'ke', 'kemudian', 
            'kepada', 'kita', 'lagi', 'lah', 'maka', 'mana', 'masih', 'mau', 
            'mempunyai', 'mereka', 'nanti', 'oleh', 'pada', 'perlu', 'saja', 
            'sama', 'sambil', 'sampai', 'sana', 'saya', 'sebab', 'sebagai', 
            'sedang', 'sekali', 'selalu', 'sementara', 'semua', 'senantiasa', 
            'serta', 'sesuatu', 'sudah', 'supaya', 'tadi', 'telah', 'tentu', 
            'terhadap', 'tidak', 'tidakkah', 'untuk', 'wah', 'waktu', 'yang'
        ]
        stop_words.update(malay_stopwords)
        
        # Property management domain stopwords
        domain_stop = {'hi', 'hello', 'please', 'thank', 'thanks', 'dear', 
                       'regards', 'ok', 'okay', 'kindly', 'dear', 'tq', 'pls'}
        stop_words.update(domain_stop)
        
        # Add custom domain stopwords
        if domain_stopwords:
            stop_words.update(domain_stopwords)
            
        return stop_words

    def detect_language(self, text):
        """Robust language detection with fallback"""
        try:
            langs = detect_langs(text)
            return [l.lang for l in langs if l.prob > 0.2]
        except:
            return ['en']  # Default to English

    def normalize_property_terms(self, text):
        """Standardize property management vocabulary"""
        pattern = re.compile(r'\b(' + '|'.join(re.escape(key) 
                            for key in self.property_terms.keys()) + r')\b')
        return pattern.sub(lambda x: self.property_terms[x.group()], text)

    def handle_colloquial(self, text):
        """Replace colloquial terms while preserving context"""
        # Sort by length to prevent partial replacements
        sorted_keys = sorted(self.colloquial_map.keys(), key=len, reverse=True)
        pattern = re.compile(r'\b(' + '|'.join(re.escape(key) 
                            for key in sorted_keys) + r')\b')
        return pattern.sub(lambda x: self.colloquial_map[x.group()], text)

    def clean_text(self, text):
        """Advanced cleaning preserving linguistic features"""
        # Preserve Malay diacritics and property terms
        text = re.sub(r'[^\w\s\u00C0-\u017F]', '', text)  # Keep Malay chars
        text = re.sub(r'\s+', ' ', text).strip()  # Normalize whitespace
        text = re.sub(r'\b\d+\b', '', text)  # Remove standalone numbers
        return text.lower()

    def stem_lemmatize(self, tokens, languages):
        """Language-aware stemming/lemmatization"""
        processed = []
        for token in tokens:
            if 'ms' in languages:
                processed.append(malay_stemmer.stem(token))
            else:
                processed.append(english_lemmatizer.lemmatize(token))
        return processed

    def preprocess(self, text):
        """Complete preprocessing pipeline"""
        try:
            if not text or len(text.strip()) == 0:
                return ""
            
            # Detect languages
            languages = self.detect_language(text)
            
            # Normalization pipeline
            text = self.normalize_property_terms(text)
            text = self.handle_colloquial(text)
            text = self.clean_text(text)
            
            # Tokenize
            tokens = word_tokenize(text)  # Works for both languages
            
            # Language-specific processing
            tokens = self.stem_lemmatize(tokens, languages)
            
            # Filtering
            tokens = [
                t for t in tokens 
                if t not in self.stopwords 
                and len(t) > 2 
                and not t.isdigit()
            ]
            
            return " ".join(tokens)
        except Exception as e:
            logger.error(f"Processing failed: {str(e)}")
            return ""

# Usage example
if __name__ == "__main__":
    # Load your dataset
    df = pd.read_csv('/home/deepuser/TYJ/BeLive/DATA/Combined_MWE_Training_Data.csv')
    
    # Initialize preprocessor with domain-specific stopwords
    domain_stopwords = ['belive', 'wetopia', 'spacify', 'pinnacle', 'emporis']
    preprocessor = AdvancedMalaysianPreprocessor(domain_stopwords)
    
    # Preprocess sentences
    df['processed_text'] = df['Sentence'].apply(preprocessor.preprocess)
    
    # Remove empty results
    df = df[df['processed_text'].str.len() > 0]
    
    # Save processed data
    output_df = df[['processed_text']]
    output_df.columns = ['text']
    output_df.to_csv('malaysian_property_topic_modeling.csv', index=False)
    
    logger.info(f"Preprocessing complete! Saved {len(output_df)} records")