// hooks/useExam.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const useExam = (examID, regNo) => {
  const queryClient = useQueryClient();

  // Fetch exam questions
  const {
    data: questionsData,
    isLoading: questionsLoading,
    error: questionsError
  } = useQuery({
    queryKey: ['examQuestions', regNo],
    queryFn: async () => {
      const { data } = await axios.get(`/api/exam-questions/${regNo}`);
      return data;
    },
    enabled: !!regNo,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Fetch answered questions
  const {
    data: answered = [],
    isLoading: answeredLoading,
    error: answeredError
  } = useQuery({
    queryKey: ['answered', examID, regNo],
    queryFn: async () => {
      const { data } = await axios.get(`/api/getAnswer/${examID}/${regNo}`);
      return data;
    },
    enabled: !!examID && !!regNo,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Check if answer exists
  const checkAnswer = async (questionId, candid, subjId, examID) => {
    const { data } = await axios.get(
      `/api/checkAnswer/${questionId}/${candid}/${subjId}/${examID}`
    );
    return data;
  };

  // Mutation for saving/updating answer
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ 
      questionId, 
      candid, 
      subjId, 
      examID, 
      selectedOption 
    }) => {
      // Check if answer exists
      const existingAnswer = await checkAnswer(questionId, candid, subjId, examID);

      if (existingAnswer) {
        // Update existing answer
        const { data } = await axios.put(`/api/saveAnswer/${existingAnswer.id}`, {
          selectedOption
        });
        return { data, isUpdate: true };
      } else {
        // Create new answer
        const { data } = await axios.post('/api/saveAnswer', {
          qid: questionId,
          canid: candid,
          subjid: subjId,
          examID,
          selectedOption,
        });
        return { data, isUpdate: false };
      }
    },
    // Optimistic update
    onMutate: async (variables) => {
      const { questionId, subjId, candid, examID, selectedOption } = variables;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['answered', examID, regNo] 
      });

      // Snapshot the previous value
      const previousAnswered = queryClient.getQueryData(['answered', examID, regNo]);

      // Optimistically update to the new value
      queryClient.setQueryData(['answered', examID, regNo], (old = []) => {
        const existingIndex = old.findIndex(
          item => item.qid === questionId && item.subjid === subjId
        );

        if (existingIndex !== -1) {
          // Update existing answer
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex],
            selectedOption
          };
          return updated;
        } else {
          // Add new answer
          return [...old, {
            qid: questionId,
            subjid: subjId,
            canid: candid,
            examID,
            selectedOption
          }];
        }
      });

      // Return context with the previous value
      return { previousAnswered };
    },
    // If mutation fails, rollback
    onError: (err, variables, context) => {
      if (context?.previousAnswered) {
        queryClient.setQueryData(
          ['answered', examID, regNo], 
          context.previousAnswered
        );
      }
      console.error('Error saving answer:', err);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['answered', examID, regNo] 
      });
    },
  });

  // Mutation for updating timer state
  const updateTimerMutation = useMutation({
    mutationFn: async ({ timeElapsed, status, examID, regNo }) => {
      const { data } = await axios.put('/api/updateTimerState', {
        newTimeElapsed: timeElapsed,
        status,
        examID,
        regNo
      });
      return data;
    },
    onError: (error) => {
      console.error('Error updating timer state:', error);
    }
  });

  return {
    // Data
    questions: questionsData?.questions || [],
    candidateSubjects: questionsData?.candidateSubjects || [],
    answered,
    
    // Loading states
    isLoading: questionsLoading || answeredLoading,
    questionsLoading,
    answeredLoading,
    
    // Errors
    error: questionsError || answeredError,
    
    // Mutations
    saveAnswer: saveAnswerMutation.mutate,
    saveAnswerAsync: saveAnswerMutation.mutateAsync,
    isSaving: saveAnswerMutation.isPending,
    
    updateTimer: updateTimerMutation.mutate,
    updateTimerAsync: updateTimerMutation.mutateAsync,
    isUpdatingTimer: updateTimerMutation.isPending,
    
    // Utility functions
    refetchAnswered: () => queryClient.invalidateQueries({ 
      queryKey: ['answered', examID, regNo] 
    }),
  };
};