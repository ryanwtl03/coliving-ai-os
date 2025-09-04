import requests

# API endpoint
api_url = "http://127.0.0.1:8000/analyze"  # adjust if running on another host/port

# Example payload
payload = {
    "text": "The room is too small and cramped, I can barely fit my desk and bed. I need more space for my things.",
    "description": "Space size and privacy concerns",
    "include_hierarchical": True,
    "general_threshold": 0.5,
    "detailed_threshold": 0.3
}

def display_topic(payload):
    # Display general topics
    general_topics = payload.get('general_topics', [])
    print(f"🎯 General Topics ({len(general_topics)}):")
    if general_topics:
        for j, topic in enumerate(general_topics, 1):
            name = topic.get('name', 'Unknown')
            prob = topic.get('probability', 0)
            reasoning = topic.get('reasoning', 'N/A')
            print(f"   {j}. {name} (confidence: {prob:.2%})")
            print(f"      Reasoning: {reasoning}")
    else:
        print("   No general topics detected")
    
    # Display detailed topics
    detailed_topics = payload.get('detailed_topics', [])
    if detailed_topics:
        print(f"\n🔍 Detailed Sub-Topics ({len(detailed_topics)}):")
        for j, topic in enumerate(detailed_topics, 1):
            name = topic.get('name', 'Unknown')
            prob = topic.get('probability', 0)
            parent = topic.get('parent_topic_name', 'Unknown')
            reasoning = topic.get('reasoning', 'N/A')
            print(f"   {j}. {name} under '{parent}' (relevance: {prob:.2%})")
            print(f"      Reasoning: {reasoning}")
    
    # Display hierarchical analysis
    hierarchical = payload.get('hierarchical_analysis', [])
    if hierarchical:
        print(f"\n🏗️  Hierarchical Structure:")
        for analysis in hierarchical:
            general = analysis.get('general_topic', {})
            detailed_list = analysis.get('detailed_topics', [])
            general_name = general.get('name', 'Unknown')
            general_prob = general.get('probability', 0)
            
            print(f"   📂 {general_name} ({general_prob:.2%})")
            for detail in detailed_list:
                detail_name = detail.get('name', 'Unknown')
                detail_prob = detail.get('probability', 0)
                print(f"      └─ {detail_name} ({detail_prob:.2%})")

try:
    response = requests.post(api_url, json=payload)
    response.raise_for_status()  # Raise error for bad responses
    print("✅ Response from API:")
    # print(response.json())
    response = response.json()
    display_topic(response)
except requests.exceptions.RequestException as e:
    print("❌ Request failed:", e)