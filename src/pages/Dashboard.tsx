import { Box, Grid, Paper, Typography, Card, CardContent, CardHeader, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Cliente {
  id: string;
  nome: string;
}

interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
}

interface OrdemServico {
  id: string;
  veiculoId: string;
  dataEntrada: string;
  status: string;
  valorTotal: number;
}

const Dashboard = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, veiculosRes, ordensRes] = await Promise.all([
          axios.get('http://localhost:3001/clientes'),
          axios.get('http://localhost:3001/veiculos'),
          axios.get('http://localhost:3001/ordens_servico')
        ]);

        setClientes(clientesRes.data);
        setVeiculos(veiculosRes.data);
        setOrdensServico(ordensRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular estatísticas
  const totalClientes = clientes.length;
  const totalVeiculos = veiculos.length;
  const ordensEmAndamento = ordensServico.filter(ordem => ordem.status === 'Em andamento').length;
  const faturamentoTotal = ordensServico.reduce((acc, ordem) => acc + ordem.valorTotal, 0);

  // Ordenar ordens de serviço por data (mais recentes primeiro)
  const ordensRecentes = [...ordensServico]
    .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime())
    .slice(0, 5);

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Cards de estatísticas */}
        <Grid item xs={10} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px' }}>
            <Typography variant="h6" color="primary">Clientes</Typography>
            <Typography variant="h3">{totalClientes}</Typography>
            <Typography variant="body2" color="text.secondary">Total cadastrado</Typography>
          </Paper>
        </Grid>

        <Grid item xs={10} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px' }}>
            <Typography variant="h6" color="primary">Veículos</Typography>
            <Typography variant="h3">{totalVeiculos}</Typography>
            <Typography variant="body2" color="text.secondary">Total cadastrado</Typography>
          </Paper>
        </Grid>

        <Grid item xs={10} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px' }}>
            <Typography variant="h6" color="primary">Ordens em Andamento</Typography>
            <Typography variant="h3">{ordensEmAndamento}</Typography>
            <Typography variant="body2" color="text.secondary">Serviços em execução</Typography>
          </Paper>
        </Grid>

        <Grid item xs={10} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px' }}>
            <Typography variant="h6" color="primary">Faturamento</Typography>
            <Typography variant="h3">R$ {faturamentoTotal.toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary">Total acumulado</Typography>
          </Paper>
        </Grid>

        {/* Ordens de serviço recentes */}
        <Grid item xs={10} md={6}>
          <Card elevation={3}>
            <CardHeader title="Ordens de Serviço Recentes" />
            <CardContent>
              {ordensRecentes.length > 0 ? (
                <List>
                  {ordensRecentes.map((ordem) => {
                    const veiculo = veiculos.find(v => v.id === ordem.veiculoId);
                    return (
                      <div key={ordem.id}>
                        <ListItem>
                          <ListItemText
                            primary={`OS #${ordem.id} - ${veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo não encontrado'}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  Status: {ordem.status}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2">
                                  Data: {new Date(ordem.dataEntrada).toLocaleDateString('pt-BR')}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2">
                                  Valor: R$ {ordem.valorTotal.toFixed(2)}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </div>
                    );
                  })}
                </List>
              ) : (
                <Typography>Nenhuma ordem de serviço encontrada</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Clientes recentes */}
        <Grid item xs={10} md={6}>
          <Card elevation={3}>
            <CardHeader title="Clientes Recentes" />
            <CardContent>
              {clientes.length > 0 ? (
                <List>
                  {clientes.slice(0, 5).map((cliente) => (
                    <div key={cliente.id}>
                      <ListItem>
                        <ListItemText
                          primary={cliente.nome}
                          secondary={`Cliente #${cliente.id}`}
                        />
                      </ListItem>
                      <Divider />
                    </div>
                  ))}
                </List>
              ) : (
                <Typography>Nenhum cliente encontrado</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;