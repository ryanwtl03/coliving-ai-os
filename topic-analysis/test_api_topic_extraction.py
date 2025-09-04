#!/usr/bin/env python3
"""
Test script for API-based hierarchical topic extraction
"""

# import sys
# import os
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from topic.api_topic_extractor import APITopicExtractor

def test_api_topic_extraction():
    """Test the API-based topic extraction"""
    
    print("🚀 Testing API-based Hierarchical Topic Extraction")
    print("=" * 60)
    
    # Initialize the API topic extractor
    extractor = APITopicExtractor()
    
    # Test API connection first
    print("🔌 Testing API connection...")
    connection_test = extractor.test_api_connection()
    if connection_test["status"] == "success":
        print("✅ API connection successful")
        print(f"   Model: {connection_test['model']}")
    else:
        print(f"❌ API connection failed: {connection_test['error']}")
        return
    
    # Test cases for Co-Living domain
    test_cases = [
        {
            "text": "My roommate is being very messy in the kitchen and leaving dirty dishes everywhere. It's affecting the cleanliness of our shared space!",
            "description": "Kitchen cleanliness issue with roommate"
        },
        {
            "text": "The room is too small and cramped, I can barely fit my desk and bed. I need more space for my things.",
            "description": "Space size and privacy concerns"
        },
        {
            "text": "My housemate plays loud music at night and it's disturbing my sleep. The noise policy needs to be enforced.",
            "description": "Noise disturbance and policy enforcement"
        },
        {
            "text": "The electricity bill this month is very expensive and we need to split it fairly among all residents.",
            "description": "Utility bills and cost sharing"
        },
        {
            "text": "There's a leak in the bathroom that needs urgent repair and the washing machine is also broken.",
            "description": "Maintenance and repair issues"
        }
    ]
    
    print("\n📊 Running hierarchical topic analysis...\n")
    
    for i, test_case in enumerate(test_cases, 1):
        text = test_case["text"]
        description = test_case["description"]
        
        print(f"🔍 Test Case {i}: {description}")
        print(f"📝 Text: \"{text}\"")
        print("-" * 50)
        
        try:
            # Perform hierarchical analysis
            result = extractor.analyze_text_hierarchical(text)
            
            # Display general topics
            general_topics = result.get('general_topics', [])
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
            detailed_topics = result.get('detailed_topics', [])
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
            hierarchical = result.get('hierarchical_analysis', [])
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
            
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
        
        print("\n" + "=" * 60 + "\n")
    
    print("🎉 API-based topic extraction testing completed!")

if __name__ == "__main__":
    test_api_topic_extraction()
