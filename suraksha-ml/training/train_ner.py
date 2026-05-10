import spacy
from spacy.training import Example
import random
import os

# Your annotated training data format
TRAIN_DATA = [
    (
        "Heavy flooding in Colombo 7 affected 200 families",
        {"entities": [(18, 27, "LOC"), (37, 40, "COUNT")]}
    ),
    (
        "Landslide reported near Kandy Road blocking traffic",
        {"entities": [(0, 9, "INCIDENT"), (21, 31, "LOC")]}
    ),
    # ... add 200+ annotated examples
]

def train_ner(train_data, output_path, n_iter=30):
    nlp = spacy.blank("en")
    ner = nlp.add_pipe("ner")
    
    for _, annotations in train_data:
        for ent in annotations["entities"]:
            ner.add_label(ent[2])
    
    nlp.begin_training()
    
    for iteration in range(n_iter):
        random.shuffle(train_data)
        losses = {}
        examples = []
        for text, annotations in train_data:
            doc = nlp.make_doc(text)
            example = Example.from_dict(doc, annotations)
            examples.append(example)
        nlp.update(examples, losses=losses)
        print(f"Iteration {iteration}: {losses}")
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    nlp.to_disk(output_path)
    print(f"Model saved to {output_path}")

if __name__ == "__main__":
    train_ner(TRAIN_DATA, "models/suraksha_ner")
