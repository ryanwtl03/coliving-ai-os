import { Tenant } from '../lib/data';
import { Card, CardContent, CardHeader } from './ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { User, MapPin, Calendar } from 'lucide-react';

interface TenantTooltipProps {
  tenant: Tenant;
}

export function TenantTooltip({ tenant }: TenantTooltipProps) {
  const personalityData = [
    { trait: 'Openness', value: tenant.bigFivePersonality.openness },
    { trait: 'Conscientiousness', value: tenant.bigFivePersonality.conscientiousness },
    { trait: 'Extraversion', value: tenant.bigFivePersonality.extraversion }, 
    { trait: 'Agreeableness', value: tenant.bigFivePersonality.agreeableness },
    { trait: 'Neuroticism', value: tenant.bigFivePersonality.neuroticism }
  ];

  return (
    <Card className="w-80 border-0 shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-lg text-gray-900">{tenant.name}</h3>
            <p className="text-sm text-gray-600">Tenant Profile</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Age:</span>
            <span className="font-medium">{tenant.age}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Gender:</span>
            <span className="font-medium">{tenant.gender}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-gray-600">Property:</span>
              <p className="font-medium">{tenant.property}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3 text-gray-900">Personality Profile</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={personalityData}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis 
                  dataKey="trait" 
                  className="text-xs fill-gray-600" 
                  tick={{ fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 1]} 
                  tick={false}
                />
                <Radar 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}