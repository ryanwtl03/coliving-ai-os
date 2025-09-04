import os

# Model Configuration
MODEL_SAVE_PATH = "models/rojak_topic_model"
N_TOPICS = 12
MAX_FEATURES = 5000

# Co-Living Hierarchical Topic Structure
GENERAL_TOPICS = {
    0: "Room & Space Issues",
    1: "Housemate Relations", 
    2: "Bills & Expenses",
    3: "House Rules & Policies",
    4: "Maintenance & Repairs",
    5: "Shared Facilities",
    6: "Noise & Disturbances",
    7: "Guest & Visitor Policies",
    8: "Safety & Security",
    9: "Move-in/Move-out",
    10: "Social Activities",
    11: "General Living Concerns"
}

# Detailed sub-topics for each general topic
DETAILED_TOPICS = {
    0: {  # Room & Space Issues
        "cleanliness": "Cleanliness",
        "space_size": "Space Size",
        "privacy": "Privacy",
        "lighting": "Lighting & Ventilation",
        "furniture": "Furniture & Amenities",
        "temperature": "Temperature Control"
    },
    1: {  # Housemate Relations
        "communication": "Communication Issues",
        "conflicts": "Conflicts & Arguments",
        "respect": "Respect & Boundaries",
        "compatibility": "Lifestyle Compatibility",
        "cooperation": "Cooperation & Teamwork",
        "cultural": "Cultural Differences"
    },
    2: {  # Bills & Expenses
        "utilities": "Utility Bills",
        "rent": "Rent Payments",
        "deposits": "Deposits & Refunds",
        "shared_costs": "Shared Expenses",
        "late_payments": "Late Payments",
        "cost_splitting": "Cost Splitting Methods"
    },
    3: {  # House Rules & Policies
        "house_rules": "Basic House Rules",
        "quiet_hours": "Quiet Hours Policy",
        "chores": "Chores & Responsibilities",
        "restrictions": "Usage Restrictions",
        "penalties": "Violation Penalties",
        "updates": "Rule Updates & Changes"
    },
    4: {  # Maintenance & Repairs
        "plumbing": "Plumbing Issues",
        "electrical": "Electrical Problems",
        "appliances": "Appliance Repairs",
        "hvac": "HVAC & Cooling",
        "structural": "Structural Issues",
        "emergency": "Emergency Repairs"
    },
    5: {  # Shared Facilities
        "kitchen": "Kitchen Usage",
        "bathroom": "Bathroom Usage",
        "living_room": "Living Room",
        "laundry": "Laundry Facilities",
        "storage": "Storage Spaces",
        "internet": "Internet & WiFi"
    },
    6: {  # Noise & Disturbances
        "loud_music": "Loud Music",
        "party_noise": "Party Noise",
        "tv_volume": "TV Volume",
        "phone_calls": "Phone Calls",
        "late_night": "Late Night Noise",
        "construction": "External Construction"
    },
    7: {  # Guest & Visitor Policies
        "overnight_guests": "Overnight Guests",
        "visitor_frequency": "Visitor Frequency",
        "guest_rules": "Guest Behavior Rules",
        "prior_notice": "Prior Notice Requirements",
        "guest_fees": "Guest Fees",
        "security_access": "Security Access for Guests"
    },
    8: {  # Safety & Security
        "door_locks": "Door Locks & Keys",
        "security_system": "Security System",
        "fire_safety": "Fire Safety",
        "personal_safety": "Personal Safety",
        "theft": "Theft & Missing Items",
        "emergency_procedures": "Emergency Procedures"
    },
    9: {  # Move-in/Move-out
        "moving_process": "Moving Process",
        "deposit_return": "Deposit Return",
        "documentation": "Documentation & Contracts",
        "handover": "Room Handover",
        "cleaning_requirements": "Move-out Cleaning",
        "notice_period": "Notice Period"
    },
    10: {  # Social Activities
        "house_meetings": "House Meetings",
        "social_events": "Social Events",
        "community_building": "Community Building",
        "celebrations": "Celebrations & Parties",
        "group_activities": "Group Activities",
        "conflict_resolution": "Conflict Resolution Sessions"
    },
    11: {  # General Living Concerns
        "daily_routine": "Daily Routine",
        "lifestyle_choices": "Lifestyle Choices",
        "health_wellness": "Health & Wellness",
        "work_study": "Work/Study Environment",
        "personal_space": "Personal Space",
        "general_complaints": "General Complaints"
    }
}

# Legacy support - flat topic labels for backward compatibility
TOPIC_LABELS = GENERAL_TOPICS

# API Configuration
API_BASE_URL = "http://localhost:8000"
API_TIMEOUT = 30

# Groq API Configuration
GROQ_API_KEY = "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"
GROQ_MODEL = "llama3-8b-8192"  # or "mixtral-8x7b-32768", "gemma-7b-it"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Preprocessing Configuration - Co-Living specific stopwords
CUSTOM_STOPWORDS = [
    'house', 'home', 'room', 'place', 'housemate', 'roommate',
    'living', 'stay', 'share', 'shared', 'co-living', 'coliving',
    'tenant', 'landlord', 'rent', 'rental', 'malaysia', 'rm', 'ringgit'
]