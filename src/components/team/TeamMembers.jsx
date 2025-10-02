import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const getTeamMembers = (role) => {
  const teamConfigs = {
    masteradmin: [
      {
        name: "Super Admin Alpha",
        email: "superadmin1@vistapro.com",
        role: "SuperAdmin",
        initials: "SA",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Super Admin Beta", 
        email: "superadmin2@vistapro.com",
        role: "SuperAdmin",
        initials: "SB",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Admin Gamma",
        email: "admin1@vistapro.com", 
        role: "Admin",
        initials: "AG",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      }
    ],
    superadmin: [
      {
        name: "Admin Team Lead",
        email: "admin.lead@vistapro.com",
        role: "Owner",
        initials: "AL",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Senior Admin",
        email: "senior.admin@vistapro.com",
        role: "Member",
        initials: "SA",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Admin Specialist",
        email: "admin.specialist@vistapro.com",
        role: "Member", 
        initials: "AS",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Team Coordinator",
        email: "coordinator@vistapro.com",
        role: "Member",
        initials: "TC",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      }
    ],
    admin: [
      {
        name: "Marketer Pro",
        email: "marketer.pro@vistapro.com",
        role: "Member",
        initials: "MP",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Sales Expert",
        email: "sales.expert@vistapro.com",
        role: "Member",
        initials: "SE",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Field Agent",
        email: "field.agent@vistapro.com",
        role: "Member",
        initials: "FA",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      }
    ],
    dealer: [
      {
        name: "Dealer Partner",
        email: "dealer.partner@vistapro.com",
        role: "Partner",
        initials: "DP",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Retail Manager",
        email: "retail.manager@vistapro.com",
        role: "Manager",
        initials: "RM",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      }
    ],
    marketer: [
      {
        name: "Team Lead",
        email: "team.lead@vistapro.com",
        role: "Owner",
        initials: "TL",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      },
      {
        name: "Senior Marketer",
        email: "senior.marketer@vistapro.com",
        role: "Member",
        initials: "SM",
        avatar: "/placeholder-avatar.jpg",
        status: "active"
      }
    ]
  };

  return teamConfigs[role] || [];
};

const TeamMembersCard = ({ role }) => {
  const teamMembers = getTeamMembers(role);

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {role === 'masteradmin' && "Manage your admin team"}
          {role === 'superadmin' && "Invite your team members to collaborate"}
          {role === 'admin' && "Manage your assigned marketers"}
          {role === 'dealer' && "Your dealer network"}
          {role === 'marketer' && "Your marketing team"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                </div>
              </div>
              <Badge 
                variant={member.role === 'Owner' || member.role === 'SuperAdmin' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {member.role}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMembersCard;
