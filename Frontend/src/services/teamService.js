import api from './api'

const teamService = {
  async getAllTeamMembers() {
    const response = await api.get('/team')
    return response.data
  },

  async getTeamMemberById(id) {
    const response = await api.get(`/team/${id}`)
    return response.data
  },

  async createTeamMember(member) {
    const response = await api.post('/team', member)
    return response.data
  },

  async updateTeamMember(id, member) {
    const response = await api.put(`/team/${id}`, member)
    return response.data
  },

  async deleteTeamMember(id) {
    const response = await api.delete(`/team/${id}`)
    return response.data
  }
}

export default teamService
