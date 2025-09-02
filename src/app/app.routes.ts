import { Routes } from '@angular/router';
import { EnterResults } from './enter-results/enter-results';
import { Home } from './home/home';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'enter-results',
        component: EnterResults
    }
];
