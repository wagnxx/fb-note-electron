import { AsyncThunk, ActionReducerMapBuilder, Draft, PayloadAction } from '@reduxjs/toolkit'

type CaseHandler<S, A = any> = (state: Draft<S>, action: A) => void

interface CaseWithFinallyHandlers<S> {
  pending?: CaseHandler<S, PayloadAction<any, string>>
  fulfilled?: CaseHandler<S, PayloadAction<any, string>>
  rejected?: CaseHandler<S, PayloadAction<any, string, any, any>>
  finally?: CaseHandler<S, any>
}

export function addAsyncCaseWithFinally<S>(
  builder: ActionReducerMapBuilder<S>,
  asyncThunk: AsyncThunk<any, any, any>,
  handlers: CaseWithFinallyHandlers<S>,
) {
  const { pending, fulfilled, rejected, finally: onFinally } = handlers

  if (pending) {
    builder.addCase(asyncThunk.pending, (state, action) => {
      pending(state, action)
    })
  }

  if (fulfilled) {
    builder.addCase(asyncThunk.fulfilled, (state, action) => {
      fulfilled(state, action)
      if (onFinally) onFinally(state, action)
    })
  } else if (onFinally) {
    builder.addCase(asyncThunk.fulfilled, (state, action) => {
      onFinally(state, action)
    })
  }

  if (rejected) {
    builder.addCase(asyncThunk.rejected, (state, action) => {
      rejected(state, action)
      if (onFinally) onFinally(state, action)
    })
  } else if (onFinally) {
    builder.addCase(asyncThunk.rejected, (state, action) => {
      onFinally(state, action)
    })
  }
}
