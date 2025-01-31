import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { UnitManager } from './UnitManager';
import { DiscountManager } from './DiscountManager';

interface AdminSection {
  id: string;
  label: string;
  component: React.ReactNode;
}

const sections: AdminSection[] = [
  {
    id: 'units',
    label: 'Units',
    component: <UnitManager />
  },
  {
    id: 'discounts',
    label: 'Discounts',
    component: <DiscountManager />
  }
];

export const AdminPanel: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState('units');

  const currentSection = sections.find(s => s.id === selectedSection) || sections[0];

  return (
    <Container maxWidth="lg">
      <Paper sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: '80vh'
        }}>
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pt: 1,
            pb: 0
          }}>
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                px: 3, 
                py: 1,
                fontSize: '1.1rem',
                color: 'text.secondary'
              }}
            >
              Products and Pricing
            </Typography>
            <Tabs 
              value={sections.findIndex(s => s.id === selectedSection)} 
              onChange={(event, newValue) => setSelectedSection(sections[newValue].id)}
              sx={{ 
                px: 2,
                minHeight: '48px',
                '& .MuiTab-root': {
                  minHeight: '48px',
                  py: 1
                }
              }}
            >
              {sections.map((section) => (
                <Tab key={section.id} label={section.label} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 1, p: 3 }}>
            {currentSection.component}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
