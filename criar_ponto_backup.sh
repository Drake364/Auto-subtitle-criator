#!/bin/bash
echo "Configurando git local e criando ponto de backup..."
git config user.name "LegendaFácil AI Developer"
git config user.email "dev@legendafacil.ai"
git add -A
git commit -m "checkpoint: Versão madura com Barra de Ações Fixa, Menu Popover ..., PWA e Presets Salvos" || echo "Nada para commitar ou commit já realizado"
echo "Ponto de backup criado com sucesso!"
